// 1. ตัวแปร Global สำหรับ DataTables และข้อมูล
let tableStudying, tableDeleting, tableAll, tablePending;
let pendingStudents = [];
let deletingStudents = [];
let currentSelectingStudent = null;

$(document).ready(function () {
    // กำหนดค่า Config สำหรับ DataTable (แสดงหน้าละ 10 รายการ)
    const tableConfig = {
        "pageLength": 10,
        "lengthChange": false,
        "language": {
            "search": "ค้นหา:",
            "zeroRecords": "ไม่พบข้อมูล",
            "info": "แสดง _START_ ถึง _END_ จาก _TOTAL_ รายการ",
            "paginate": {
                "next": "ถัดไป",
                "previous": "ก่อนหน้า"
            }
        }
    };

    // Initial DataTables
    tableStudying = $('#studyingStudents').DataTable(tableConfig);
    tableAll = $('#allStudents').DataTable(tableConfig);
    tableDeleting = $('#deletingStudents').DataTable(tableConfig);
    tablePending = $('#pendingStudents').DataTable(tableConfig);
});

// --- Helper Function: ลบแถวและจัดการเลขหน้า (Pagination) ให้ถูกต้อง ---
function smartRemoveRow(table, rowElement) {
    const pageInfo = table.page.info();

    // ลบแถวออกจาก DataTable
    table.row(rowElement).remove();

    // เช็คว่าถ้าลบตัวสุดท้ายของหน้า (และไม่ใช่หน้าแรก) ให้ถอยกลับไป 1 หน้า
    if (pageInfo.recordsDisplay - 1 <= pageInfo.start && pageInfo.page > 0) {
        table.page('previous').draw();
    } else {
        table.draw(false); // วาดใหม่ที่หน้าเดิม
    }
}

// ==========================================
// ส่วนที่ 1: จัดการตาราง "ทั้งหมด" -> "กำลังจะเพิ่ม"
// ==========================================

function openAddStudentPopup(id, name, code, currentGrade) {
    currentSelectingStudent = { id, name, code, currentGrade };

    document.getElementById('popupStudentId').value = id;
   
    document.getElementById('popupInstallment').value = 1;
    document.getElementById('popupPaymentType').value = 'เงินสด';

    const myModal = new bootstrap.Modal(document.getElementById('studentPopup'));
    myModal.show();
}

function addStudentToPending() {
   
    const installment = document.getElementById('popupInstallment').value;
    const paymentType = document.getElementById('popupPaymentType').value;
    // เพิ่มการดึงค่าวันที่จาก Modal
    const paymentDate = document.getElementById('popupPaymentDate').value;
    const s = currentSelectingStudent;

    if (pendingStudents.some(item => item.Id == s.id)) {
        alert('นักเรียนนี้อยู่ในรายการแล้ว');
        return;
    }

    pendingStudents.push({
        Id: s.id,
        Code: s.code,
        Name: s.name,
        CurrentGrade: s.currentGrade,
        PaymentDate: paymentDate,
        InstallmentCount: installment,
        PaymentType: paymentType
    });

    const rowToRemove = document.querySelector(`#allStudents tr[data-id="${s.id}"]`);
    if (rowToRemove) {
        smartRemoveRow(tableAll, rowToRemove);
    }

    renderPendingStudents();
    bootstrap.Modal.getInstance(document.getElementById('studentPopup')).hide();
}

function renderPendingStudents() {
    tablePending.clear();
    const container = document.getElementById('containerpendingStudents');

    if (pendingStudents.length > 0) {
        container.style.display = 'block';
        pendingStudents.forEach(s => {
            const newNode = tablePending.row.add([
                s.Code, s.Name,  s.InstallmentCount, s.PaymentType,
                `<button class="btn btn-danger btn-sm" onclick="removePendingStudent(${s.Id})">Cancel</button>`
            ]).node();
            if (newNode) $(newNode).attr('data-id', s.Id);
        });
    } else {
        container.style.display = 'none';
    }
    tablePending.draw();
}

function removePendingStudent(id) {
    const student = pendingStudents.find(s => s.Id == id);
    if (!student) return;

    // คืนค่ากลับตาราง "ทั้งหมด" โดยใช้ CurrentGrade
    const undoNode = tableAll.row.add([
        student.Code,
        student.Name,
        student.CurrentGrade,
        `<button class="btn btn-success btn-sm" onclick="openAddStudentPopup(${student.Id}, '${student.Name}', '${student.Code}', '${student.CurrentGrade}')">Add</button>`
    ]).draw(false).node();

    if (undoNode) $(undoNode).attr('data-id', student.Id);

    pendingStudents = pendingStudents.filter(s => s.Id != id);
    renderPendingStudents();
}

// ==========================================
// ส่วนที่ 2: จัดการตาราง "เรียนอยู่" -> "กำลังจะลบ"
// ==========================================

function moveToDelete(id) {
    const rowElement = document.querySelector(`#studyingStudents tr[data-id="${id}"]`);
    if (!rowElement) return;

    deletingStudents.push({
        Id: id,
        Code: rowElement.cells[0].innerText.trim(),
        Name: rowElement.cells[1].innerText.trim(),
        CurrentGrade: rowElement.cells[2].innerText.trim()
    });

    smartRemoveRow(tableStudying, rowElement);
    renderDeletingStudents();
}

function renderDeletingStudents() {
    tableDeleting.clear();
    const container = document.getElementById('containerdeletingStudents');

    if (deletingStudents.length > 0) {
        container.style.display = 'block';
        deletingStudents.forEach(s => {
            const newNode = tableDeleting.row.add([
                s.Code,
                s.Name,
                s.CurrentGrade,
                `<button class="btn btn-danger btn-sm" onclick="undoDeleteStudent(${s.Id})">Cancel</button>`
            ]).node();
            if (newNode) $(newNode).attr('data-id', s.Id);
        });
    } else {
        container.style.display = 'none';
    }
    tableDeleting.draw();
}

function undoDeleteStudent(id) {
    const student = deletingStudents.find(s => s.Id == id);
    if (!student) return;

    // คืนค่ากลับตาราง "เรียนอยู่" พร้อมใส่ Attribute data-id และเงื่อนไข Disable ปุ่ม
    const undoNode = tableStudying.row.add([
        student.Code,
        student.Name,
        student.CurrentGrade,
        `<button class="btn btn-warning btn-sm" onclick="openEditPaymentModal(${student.Id}, '${student.Name}', 1, 'เงินสด', '')">แก้ไข</button>`,
        `<button class="btn btn-danger btn-sm" onclick="moveToDelete(${student.Id})">ลบ</button>`
    ]).draw(false).node();

    if (undoNode) $(undoNode).attr('data-id', student.Id);

    deletingStudents = deletingStudents.filter(s => s.Id != id);
    renderDeletingStudents();
}



document.addEventListener('DOMContentLoaded', function () {
    const paymentType = document.getElementById('popupPaymentType');
    const installmentInput = document.getElementById('popupInstallment');
    const installmentDiv = document.getElementById('installmentDiv');

    // เช็คค่าเริ่มต้น
    toggleInstallment();

    // เมื่อเปลี่ยน Payment Type
    paymentType.addEventListener('change', toggleInstallment);

    function toggleInstallment() {
        if (paymentType.value === 'ผ่อน') {
            installmentDiv.style.display = 'block';
        } else {
            // เงินสด → ตั้งค่าเป็น 1 และซ่อน
            installmentInput.value = 1;
            installmentDiv.style.display = 'none';
        }
    }
});

// 1. ฟังก์ชันเปิด Modal พร้อมใส่ข้อมูลเดิม
function openEditPaymentModal(id, name, installment, type, date) {
    document.getElementById('editStudentId').value = id;
    document.getElementById('editStudentName').value = name;
    document.getElementById('editPaymentType').value = type || "เงินสด";
    document.getElementById('editInstallmentCount').value = installment;

    // จัดการเรื่องวันที่ (Format: yyyy-MM-dd)
    if (date) {
        document.getElementById('editPaymentDate').value = date.split('T')[0];
    } else {
        document.getElementById('editPaymentDate').value = "";
    }

    const myModal = new bootstrap.Modal(document.getElementById('editPaymentModal'));
    myModal.show();
}



// --- ส่วนที่ 3: ฟังก์ชัน SaveEverything ด้วย Axios ---
async function saveEverything() {
    try {
        // 1. ดึง Anti-Forgery Token จาก HTML
        const tokenElement = document.querySelector('input[name="__RequestVerificationToken"]');
        if (!tokenElement) {
            alert("ไม่พบ Anti-Forgery Token กรุณาเพิ่ม @Html.AntiForgeryToken() ในหน้า HTML");
            return;
        }
        const token = tokenElement.value;
        const scheduleId = document.getElementById('hiddenScheduleId').value;
        // 2. รวบรวมข้อมูล Header และข้อมูลจากตัวแปร global
        const payload = {

            ScheduleId: parseInt(scheduleId), // ดึงค่าจาก Model ฝั่ง C#
            CourseName: document.getElementById('CoursesName').value,
            Price: parseFloat(document.getElementById('price').value),
            RoomName: document.getElementById('Room').value,
            TeacherId: parseInt(document.getElementById('Teacher').value),

            // ข้อมูลจากตัวแปร pendingStudents (ตาราง 4)
            StudentsToAdd: pendingStudents.map(s => ({
                StudentId: s.Id,
                PaymentType: s.PaymentType,
                InstallmentCount: parseInt(s.InstallmentCount),
                // ถ้ามีฟิลด์วันที่ใน pending สามารถเพิ่มตรงนี้ได้
                PaymentDate: s.PaymentDate || null
            })),

            // ข้อมูล ID จากตัวแปร deletingStudents (ตาราง 2)
            StudentIdsToDelete: deletingStudents.map(s => s.Id)
        };

        // 3. แสดง Loading หรือแจ้งเตือนกำลังบันทึก (Optional)
        console.log("Sending Payload:", payload);

        // 4. ส่งข้อมูลด้วย Axios
        const response = await axios.post('?handler=SaveEverything', payload, {
            headers: {
                'RequestVerificationToken': token,
                'Content-Type': 'application/json'
            }
        });

        // 5. จัดการผลลัพธ์
        if (response.data.success) {
            Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ',
                text: 'ข้อมูลทั้งหมดถูกบันทึกลงฐานข้อมูลแล้ว',
                confirmButtonText: 'ตกลง'
            }).then(() => {
                window.location.reload(); // รีโหลดหน้าเพื่อดึงข้อมูลใหม่จาก DB
            });
        } else {
            alert("บันทึกไม่สำเร็จ: " + response.data.message);
        }

    } catch (error) {
        console.error("Axios Error:", error);
        let errorMsg = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
        if (error.response && error.response.data) {
            errorMsg += ": " + error.response.data.message;
        }
        alert(errorMsg);
    }
}