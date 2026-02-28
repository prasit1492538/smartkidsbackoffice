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
                if (Roll === "superadmin")
                {
                    response.data.data.forEach((datalist, index) => {

                        rows += `
                        <tr>
                            <td class="text-center">${index + 1}</td>
                            <td class="text-center">${datalist.name || ''}</td>
                            <td class="text-center">${datalist.priceTotal || ''}</td>
                           <td class="text-center">${datalist.sessionCount || ''}</td>
                           <td class="text-center">${datalist.roomName || ''}</td>
                           <td class="text-center">${datalist.teacherName || ''}</td>
                           
                           <td class="text-center">${datalist.branchName || ''}</td>
                            <td class="text-center">
                                <button type="button" class="btn btn-outline-success" onclick="location.href='EditManageCourses?id=${datalist.id}'">
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
                else
                {
                    response.data.data.forEach((datalist, index) => {

                        rows += `
                        <tr class="text-center">
                             <td class="text-center">${index + 1}</td>
                            <td class="text-center">${datalist.name || ''}</td>
                            <td class="text-center">${datalist.priceTotal || ''}</td>
                           <td class="text-center">${datalist.sessionCount || ''}</td>
                           <td class="text-center">${datalist.roomName || ''}</td>
                          
                             <td class="text-center">${datalist.teacherName || ''}</td>
                              
                            <td class="text-center">
                                <button type="button" class="btn btn-outline-success" onclick="location.href='EditManageCourses?id=${datalist.id}'">
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
function openAddModal() {
    // ใช้ Bootstrap modal API เพื่อเปิด modal
    var addModal = new bootstrap.Modal(document.getElementById('Add'));
    addModal.show();
}
function filterTeacherByBranch(branchSelect) {
    const branchId = branchSelect.value;
    const teacherSelect = document.getElementById('TeacherInfo');
    const options = teacherSelect.querySelectorAll('option');

    // reset + enable
    teacherSelect.disabled = false;
    document.getElementById('btnadd').disabled = false;
    teacherSelect.value = '';

    let found = false;

    options.forEach(opt => {
        if (!opt.dataset.branch) return; // ข้าม placeholder

        if (opt.dataset.branch === branchId) {
            opt.hidden = false;
            found = true;
        } else {
            opt.hidden = true;
        }
    });

    // ถ้าไม่มีครูในสาขานี้ → disable
    if (!found) {
        teacherSelect.disabled = true;
        document.getElementById('btnadd').disabled = true;
    }
}
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
            submitFormData("addForm", "?handler=AddData", "Add");
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
function onDeleteRow(id) {
    // ยืนยันการลบ
    Swal.fire({
        title: 'Confirm deletion?',
        text: "You won't be able to undo this action!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteUser(id);
        }
    });
}
function deleteUser(id) {
    axios.get(`?handler=DeletedData&id=${id}`)
        .then(response => {
            if (response.data.success) {
                Swal.fire('Deleted!', 'The data has been successfully deleted.', 'success');
                getDatatable(response.data.roll); // โหลดข้อมูลใหม่
            } else {
                if (response.data.code === "440") {
                    modaltimeout(response.data.message);
                } else {
                    Swal.fire({
                        title: 'Warning',
                        text: `Message: ${response.data.message}`,
                        icon: 'warning'
                    });
                }
            }
        })
        .catch(error => {
            Swal.fire('Error!', error.response?.data?.message || 'Failed to delete data', 'error');
        });
}