let draggedCell = null;
let scheduleData = []; // เก็บข้อมูลใน Memory

// คีย์สำหรับเก็บข้อมูลแยกตามตาราง (ป้องกันการสลับตารางแล้วข้อมูลปนกัน)
const getStorageKey = () => `schedule_cache_${document.getElementById("hiddenScheduleId").value}`;

// ---------------- 1. LOAD SCHEDULE (Cache First) ----------------
async function loadSchedule() {
    const storageKey = getStorageKey();
    const cachedData = sessionStorage.getItem(storageKey);

    if (cachedData) {
        console.log("Loading from sessionStorage...");
        scheduleData = JSON.parse(cachedData);
        renderScheduleTable();
    } else {
        console.log("Loading from Server...");
        try {
            const scheduleId = document.getElementById("hiddenScheduleId").value;
            // เรียก Handler 'Datatable' ใน Razor Pages
            const response = await axios.get(`?handler=Datatable&id=${scheduleId}`);

            if (response.data.success) {
                scheduleData = response.data.data;
                // เก็บลง sessionStorage ทันทีที่โหลดจาก Server ครั้งแรก
                sessionStorage.setItem(storageKey, JSON.stringify(scheduleData));
                renderScheduleTable();
            } else {
                console.error("Server error:", response.data.message);
            }
        } catch (error) {
            console.error("Network Error:", error);
            Swal.fire("ผิดพลาด", "ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ได้", "error");
        }
    }
}

// ---------------- 2. RENDER TABLE ----------------
function renderScheduleTable() {
    // ล้าง UI ทั้งหมดก่อนวาดใหม่
    document.querySelectorAll("td[id^='cell-']").forEach(cell => {
        cell.innerText = "";
        cell.classList.remove("has-course");
    });

    // วาดเฉพาะวิชาที่ไม่ได้ถูก Flag ว่าลบ (isDeleted)
    scheduleData.filter(s => !s.isDeleted).forEach(schedule => {
        const cell = document.getElementById(`cell-${schedule.dayId}-${schedule.periodId}`);
        if (cell) {
            cell.innerText = schedule.courseName;
            cell.classList.add("has-course");
            // เก็บ Metadata ไว้ที่ Element สำหรับฟังก์ชันลบ/ลาก
            cell.dataset.dayId = schedule.dayId;
            cell.dataset.periodId = schedule.periodId;
        }
    });
}

// ---------------- 3. CACHE SYNC ----------------
function syncToCache() {
    sessionStorage.setItem(getStorageKey(), JSON.stringify(scheduleData));
}

// ---------------- 4. ADD SCHEDULE ----------------
function addSchedule() {
    const scheduleId = document.getElementById("hiddenScheduleId").value;
    const courseSelect = document.getElementById("courseSelect");
    const periodSelect = document.getElementById("periodSelect");
    const days = document.querySelectorAll(".day:checked");

    const courseId = courseSelect.value;
    const courseName = courseSelect.options[courseSelect.selectedIndex]?.text;
    const periodId = parseInt(periodSelect.value);

    if (!courseId || !periodId || days.length === 0) {
        Swal.fire("ข้อมูลไม่ครบ", "กรุณาเลือกวิชา วัน และคาบ", "warning");
        return;
    }

    days.forEach(d => {
        const dayId = parseInt(d.value);
        // เช็คว่าคาบชนไหม (นับเฉพาะที่ไม่ถูกลบ)
        const exists = scheduleData.find(s => s.dayId === dayId && s.periodId === periodId && !s.isDeleted);

        if (exists) {
            console.warn(`คาบชนที่ วัน ${dayId} คาบ ${periodId}`);
            return;
        }

        scheduleData.push({
            id: null, // ยังไม่มี ID ใน DB
            scheduleId: parseInt(scheduleId),
            courseId: courseId,
            courseName: courseName,
            dayId: dayId,
            periodId: periodId,
            isNew: true
        });
    });

    renderScheduleTable();
    syncToCache(); // บันทึกลง sessionStorage
    document.querySelectorAll(".day").forEach(d => d.checked = false);
    Swal.fire("สำเร็จ", "เพิ่มวิชาลงตาราง (ชั่วคราว) แล้ว", "success");
}

// ---------------- 5. DELETE (จาก Memory) ----------------
function bindDelete() {
    // ใช้ Event Delegation หรือ Bind ตรงๆ
    document.querySelectorAll("td[id^='cell-']").forEach(cell => {
        cell.addEventListener("click", async () => {
            if (!cell.innerText.trim()) return;

            const dayId = parseInt(cell.dataset.dayId);
            const periodId = parseInt(cell.dataset.periodId);

            const result = await Swal.fire({
                title: "ลบวิชา?",
                text: `ต้องการลบ "${cell.innerText}" ออกจากตารางชั่วคราวหรือไม่?`,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "ลบ",
                cancelButtonText: "ยกเลิก"
            });

            if (result.isConfirmed) {
                const index = scheduleData.findIndex(s => s.dayId === dayId && s.periodId === periodId && !s.isDeleted);
                if (index !== -1) {
                    if (scheduleData[index].id) {
                        // ถ้ามี ID (ข้อมูลจาก DB) ให้ปัก Flag ลบ
                        scheduleData[index].isDeleted = true;
                    } else {
                        // ถ้าเป็นข้อมูลใหม่ที่ยังไม่เซฟ ลบออกเลย
                        scheduleData.splice(index, 1);
                    }
                }
                renderScheduleTable();
                syncToCache();
            }
        });
    });
}

// ---------------- 6. DRAG & DROP ----------------
function enableDrag() {
    document.querySelectorAll("td[id^='cell-']").forEach(cell => {
        cell.draggable = true;

        cell.addEventListener("dragstart", e => {
            if (!cell.innerText.trim()) {
                e.preventDefault();
                return;
            }
            draggedCell = cell;
            cell.classList.add("dragging");
        });

        cell.addEventListener("dragend", () => cell.classList.remove("dragging"));
        cell.addEventListener("dragover", e => e.preventDefault());

        cell.addEventListener("drop", e => {
            e.preventDefault();
            if (!draggedCell || cell === draggedCell) return;
            if (cell.innerText.trim()) {
                Swal.fire("ย้ายไม่ได้", "ช่องปลายทางมีข้อมูลแล้ว", "warning");
                return;
            }
            moveSchedule(draggedCell, cell);
        });
    });
}

function moveSchedule(fromCell, toCell) {
    const fromDayId = parseInt(fromCell.dataset.dayId);
    const fromPeriodId = parseInt(fromCell.dataset.periodId);
    const toDayId = parseInt(toCell.dataset.dayId);
    const toPeriodId = parseInt(toCell.dataset.periodId);

    const index = scheduleData.findIndex(s => s.dayId === fromDayId && s.periodId === fromPeriodId && !s.isDeleted);

    if (index !== -1) {
        scheduleData[index].dayId = toDayId;
        scheduleData[index].periodId = toPeriodId;
        scheduleData[index].isModified = true;

        renderScheduleTable();
        syncToCache();
    }
}

// ---------------- 7. SAVE TO SERVER ----------------
async function saveAllSchedules() {
    const toAdd = scheduleData.filter(s => s.isNew && !s.isDeleted);
    const toUpdate = scheduleData.filter(s => s.isModified && !s.isDeleted && !s.isNew);
    const toDelete = scheduleData.filter(s => s.isDeleted && s.id);

    if (toAdd.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
        Swal.fire("ไม่มีการเปลี่ยนแปลง", "ไม่มีข้อมูลที่ต้องบันทึก", "info");
        return;
    }

    try {
        const response = await axios.post('?handler=SaveSchedules', {
            add: toAdd,
            update: toUpdate,
            delete: toDelete.map(s => s.id)
        }, {
            headers: { "RequestVerificationToken": document.querySelector('input[name="__RequestVerificationToken"]').value }
        });

        if (response.data.success) {
            sessionStorage.removeItem(getStorageKey()); // ล้าง Cache เมื่อบันทึกสำเร็จ
            await Swal.fire("สำเร็จ", "บันทึกข้อมูลลงฐานข้อมูลเรียบร้อยแล้ว", "success");
            location.reload(); // โหลดหน้าใหม่เพื่อให้ข้อมูลล่าสุดจาก DB แสดงผล
        }
    } catch (error) {
        Swal.fire("ผิดพลาด", "เกิดข้อผิดพลาดในการบันทึก", "error");
    }
}

// ---------------- 8. RESET ----------------
async function resetSchedules() {
    const result = await Swal.fire({
        title: "ยกเลิกการแก้ไข?",
        text: "ข้อมูลที่คุณแก้ไขในเครื่องจะถูกล้างทิ้ง และโหลดใหม่จากเซิร์ฟเวอร์",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน"
    });

    if (result.isConfirmed) {
        sessionStorage.removeItem(getStorageKey());
        location.reload();
    }
}

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", () => {
    loadSchedule();
    bindDelete();
    enableDrag();
});