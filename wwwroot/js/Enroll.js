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
                             <td class="text-center">${datalist.name || ''}</td>
                            <td class="text-center">${datalist.priceTotal || ''}</td>
                           <td class="text-center">${datalist.sessionCount || ''}</td>
                           <td class="text-center">${datalist.roomName || ''}</td>
                           <td class="text-center">${datalist.teacherName || ''}</td>
                           
                           <td class="text-center">${datalist.branchName || ''}</td>
                            <td class="text-center">
                                <button type="button" class="btn btn-outline-success" onclick="location.href='EnrollmentManagementEdit?id=${datalist.id}'">
                                    <i class="bx bxs-group" aria-hidden="true"></i> Manage Courses
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
                             <td class="text-center">${datalist.name || ''}</td>
                            <td class="text-center">${datalist.priceTotal || ''}</td>
                           <td class="text-center">${datalist.sessionCount || ''}</td>
                           <td class="text-center">${datalist.roomName || ''}</td>
                          
                             <td class="text-center">${datalist.teacherName || ''}</td>
                              
                            <td class="text-center">
                                <button type="button" class="btn btn-outline-success" onclick="location.href='EnrollmentManagementEdit?id=${datalist.id}'">
                                    <i class="bx bxs-group" aria-hidden="true"></i> Manage Courses
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