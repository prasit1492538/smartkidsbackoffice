function openAddModal() {
	// ใช้ Bootstrap modal API เพื่อเปิด modal
	var addModal = new bootstrap.Modal(document.getElementById('scheduleModal'));
	addModal.show();
}
// ฟังก์ชันช่วยจัดรูปแบบวันที่เป็น dd/mm/yyyy (ค.ศ.)
function formatDateToDMY(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

flatpickr("#startDate", {
    dateFormat: "d/m/Y",
    locale: {
        firstDayOfWeek: 1
    },
    disable: [
        function (date) {
            return date.getDay() !== 1; // เลือกได้เฉพาะวันจันทร์
        }
    ],
    onChange: function (selectedDates) {
        if (selectedDates.length > 0) {
            const start = selectedDates[0];

            // 1. คำนวณวันอาทิตย์ (บวกไป 6 วัน)
            const end = new Date(start);
            end.setDate(start.getDate() + 6);

            // 2. แปลงเป็นรูปแบบ dd/mm/yyyy ทั้งคู่
            const startStr = formatDateToDMY(start);
            const endStr = formatDateToDMY(end);

            // 3. อัปเดตค่าลงในช่อง Input
            document.getElementById("endDate").value = endStr;

            // 4. เจนชื่อ Schedule Name อัตโนมัติ (เป็น ค.ศ. สวยๆ)
            document.getElementById("scheduleName").value = `Schedule ${startStr} - ${endStr}`;
        }
    }
});

function addConfirm() {
    const form = document.getElementById('addForm');

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        const invalidField = form.querySelector(':invalid');
        if (invalidField) {
            invalidField.focus();
            invalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
    }



    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to save the data?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, save it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            submitFormData("addForm", "?handler=AddData", "scheduleModal");
        }
    });

    return false;
}
function submitFormData(formId, url, modalId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);

    axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
        .then(response => {
            const data = response.data;
            if (data.success) {
                console.log(data)
                // ปิด modal โดยใช้ Bootstrap 5 JavaScript API
                const modalEl = document.getElementById(modalId);
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) {
                    modal.hide();
                }
                form.reset();


                // เอาคลาส was-validated ออก เพื่อให้ฟอร์มกลับมาเหมือนใหม่
                form.classList.remove('was-validated');
                Swal.fire('Success!', 'The data has been saved successfully.', 'success')
                    .then(() => {
                        // โค้ดทั้งหมดนี้จะทำงาน 'หลังจาก' SweetAlert ถูกปิดโดยผู้ใช้
                        $('#loading').modal('show');
                        getDatatable(data.roll);
                    });
            } else {
                if (data.code === "440") {
                    modaltimeout(data.message);
                } else {
                    Swal.fire({
                        title: 'An error occurred',
                        text: `Message: ${data.message}`,
                        icon: 'warning'
                    });
                }
            }
        })
        .catch(error => {
            Swal.fire({
                title: 'An error occurred',
                text: `Message: ${error}`,
                icon: 'warning'
            });
        });
}
function getDatatable(Roll) {
    axios({
        method: 'get',
        url: `?handler=Datatable`,
    })
        .then(response => {
            if (response.status === 200) {
                console.log('Received data:', response.data.data);

                $('#loading').modal('hide');
                let rows = "";
                if (Roll === "superadmin") {
                    response.data.data.forEach((datalist, index) => {

                        rows += `
                        <tr>
                            <td class="text-center">${index + 1}</td>
                            <td class="text-center">${datalist.scheduleName || ''}</td>
                            <td class="text-center">${datalist.startDate || ''}</td>
                           <td class="text-center">${datalist.endDate || ''}</td>
                           <td class="text-center">${datalist.branchName || ''}</td>
                            <td class="text-center">
                                <button type="button" class="btn btn-outline-success" onclick="location.href='EditManageSchedules?id=${datalist.id}'">
                                    <i class="bx bxs-group" aria-hidden="true"></i> Manage Courses
                                </button>
                            </td>
                            <td class="text-center">
                                <button type="button" class="btn btn-outline-danger" onclick="onDeleteRow(${datalist.id})">
                                    <i class="bx bx-trash" aria-hidden="true"></i> Delete
                                </button>
                            </td>
                        </tr>
                        `;
                    });
                }
                else {
                    response.data.data.forEach((datalist, index) => {

                        rows += `
                        <tr class="text-center">
                             <td class="text-center">${index + 1}</td>
                            <td class="text-center">${datalist.scheduleName || ''}</td>
                            <td class="text-center">${datalist.startDate || ''}</td>
                           <td class="text-center">${datalist.endDate || ''}</td>
                              
                            <td class="text-center">
                                <button type="button" class="btn btn-outline-success" onclick="location.href='EditManageSchedules?id=${datalist.id}'">
                                    <i class="bx bxs-group" aria-hidden="true"></i> Manage Courses
                                </button>
                            </td>
                            <td class="text-center">
                                <button type="button" class="btn btn-outline-danger" onclick="onDeleteRow(${datalist.id})">
                                    <i class="bx bx-trash" aria-hidden="true"></i> Delete
                                </button>
                            </td>
                        </tr>
                        `;
                    });
                }


                // ใช้ jQuery กำหนดเนื้อหาใน tbody

                // ถ้ามี DataTable ตัวเก่าอยู่แล้ว ให้ทำลายก่อนสร้างใหม่
                if ($.fn.DataTable.isDataTable('#showdata')) {
                    $('#showdata').DataTable().clear().destroy();
                }
                $('#showdata tbody').html(rows);
                // สร้าง DataTable ใหม่
                $("#showdata").DataTable({
                    "lengthMenu": [50, 100, 500, 1000, 10000],
                });

            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'An error occurred',
                text: error.response?.data?.message || error.message,
                icon: 'error'
            });

        });
}