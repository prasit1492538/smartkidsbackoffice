$(document).ready(function () {
	$("#Account").addClass("show");
	$('#showdata').DataTable({  // เปิดการเรียงลำดับ
		responsive: true,    // รองรับมือถือ
		columnDefs: [
			{ orderable: false, targets: [3, 4] } // ปิดการเรียงลำดับที่ปุ่ม Edit/Delete
		]
	});
	$('#loading').modal('show');
	getDatatable()
});

function getDatatable() {
	axios({
		method: 'get',
		url: `?handler=Datatable`,
	})
		.then(response => {
			if (response.status === 200) {
				$('#loading').modal('hide');
				if (response.data.success) {


				


					let rows = "";
					// วนลูปหลัก: วนผ่านรายการผู้ปกครอง
					response.data.data.forEach((parentInfo, index) => {


						// วนลูปซ้อน: วนผ่านรายการนักเรียนที่เกี่ยวข้อง
						let studentListHtml = '';

						if (parentInfo.students && parentInfo.students.length > 0) {

							// วนลูปเพื่อสร้าง HTML สำหรับนักเรียนแต่ละคน
							parentInfo.students.forEach((student, sIndex) => {
								studentListHtml += `
				 ${student.fullName || '-'} (${student.nickname || '-'})<br/>
			`;
							});

						} else if (parentInfo.students.length = 1) {
							parentInfo.students.forEach((student, sIndex) => {
								studentListHtml += `
				 ${student.fullName || '-'} (${student.nickname || '-'})<br/>
			`;
							});

						} else {
							studentListHtml = '-';
						}

						// ใช้ parentInfo.userId เป็น ID สำหรับปุ่ม Edit/Delete
						const rowId = parentInfo.userId;

						rows += `
					<tr class="text-center">

						<td class="text-center">${index + 1}</td>

						<td class="text-center">
							
						${parentInfo.firstName} ${parentInfo.lastName || '-'} <small class="text-secondary">(${parentInfo.relationship || '-'})</small>	
					</td>
						<td class="text-center">${parentInfo.phone || '-'}</td>
						<td class="text-center">${parentInfo.email || '-'}</td>
						<td class="text-center">${parentInfo.branchName || '-'}</td>

						<td class="text-center">
							${studentListHtml}
						</td>
						
						<td>
							<button type="button" class="btn btn-outline-primary" onclick="onEditRow(${rowId})">
								<i class="bx bx-edit" aria-hidden="true"></i> Edit
							</button>
						</td>
						<td>
							<button type="button" class="btn btn-outline-danger" onclick="onDeleteRow(${rowId})">
								<i class="bx bx-trash" aria-hidden="true"></i> Delete
							</button>
						</td>
					</tr>
				`;



					});

					// ใช้ jQuery กำหนดเนื้อหาใน tbody

					// ถ้ามี DataTable ตัวเก่าอยู่แล้ว ให้ทำลายก่อนสร้างใหม่
					if ($.fn.DataTable.isDataTable('#showdata')) {
						$('#showdata').DataTable().clear().destroy();
					}
					$('#showdata tbody').html(rows);
					// สร้าง DataTable ใหม่
					$('#showdata').DataTable({  // เปิดการเรียงลำดับ
						responsive: true,    // รองรับมือถือ
						columnDefs: [
							{ orderable: false, targets: [6, 7] } // ปิดการเรียงลำดับที่ปุ่ม Edit/Delete
						]
					});

				}
				else {
					Swal.fire({
						title: 'An error occurred',
						text: response.data.message,
						icon: 'error'
					});
				}
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

//edit
function onEditRow(id) {
	// ไปที่หน้าแก้ไขหรือเปิด modal
	axios.get(`?handler=DataEdit&id=${id}`)
		.then(response => {
			if (response.status === 200) { console.log("Modaldata", response.data) }

			if (response.data.success) {

				const Modaldata = response.data.data;

				console.log("Modaldata", Modaldata)

				openEditModal(Modaldata); // ส่งข้อมูลเข้า modal


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
			Swal.fire('Error!', error.response?.data?.message || 'Failed', 'error');
		});
}

function openEditModal(parentInfo) {
	// 1. Set Hidden ID และ Title
	$('#editParentId').val(parentInfo.userId);
	$('#parent-name-title').text(`${parentInfo.firstName} ${parentInfo.lastName}`);

	// 2. Set ข้อมูลผู้ปกครองหลัก
	$('#editParentFirstName').val(parentInfo.firstName);
	$('#editParentLastName').val(parentInfo.lastName);
	$('#editParentPhone').val(parentInfo.phone);
	$('#editParentEmail').val(parentInfo.email);

	$('#editParentJob').val(parentInfo.job);
	$('#editParentWorkplace').val(parentInfo.workplace);
	// === Relationship logic ===
	const relation = parentInfo.relationship;

	if (relation === "บิดา" || relation === "มารดา") {
		$('#relationshipSelect').val(relation);
		$('#relationshipOther').hide().val("");
		$('#editParentRelationship').val(relation);
	} else {
		$('#relationshipSelect').val("Other");
		$('#relationshipOther').show().val(relation);
		$('#editParentRelationship').val(relation);
	}
	// 3. สร้างและเติมรายการนักเรียน
	const studentContainer = $('#student-list-container');
	studentContainer.empty(); // ล้างข้อมูลเก่า

	if (parentInfo.students && parentInfo.students.length > 0) {

		let rowsHtml = '';
		parentInfo.students.forEach((student, sIndex) => {
			rowsHtml += createStudentHtml(student, sIndex);
		});

		const tableHtml = `
        <table class="table table-bordered table-striped table-sm">
            <thead class="table-light">
                <tr class="text-center">
                    <th>#</th>
                    <th>รหัสนักเรียน</th>
                    <th>ชื่อ-นามสกุล</th>
                    <th>ชื่อเล่น</th>
                    <th>ชั้นเรียน</th>
                    <th>วันเกิด</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    `;

		studentContainer.html(tableHtml);

	} else {
		studentContainer.html(
			'<p class="text-danger">ไม่พบข้อมูลนักเรียนที่เกี่ยวข้องกับผู้ปกครองท่านนี้</p>'
		);
	}
	pendingNewStudents = [];
	$('#new-student-pending-list').empty();

	// ** 1. Event Listener: แสดง/ซ่อนฟอร์ม **
	$('#btnShowAddStudentForm').off('click').on('click', function () {
		$('#add-student-form-area').slideToggle();
	});

	// ** 2. Event Listener: เพิ่มนักเรียนใหม่เข้า List ชั่วคราว **
	$('#btnAddToList').off('click').on('click', addNewStudentToPendingList);


	// 4. แสดง Modal
	$('#ParentEditModal').modal('show');
}
function editConfirm() {
	const form = document.getElementById('parentEditForm');

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
		text: "Do you want to edit the data?",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, edit it!',
		cancelButtonText: 'Cancel'
	}).then((result) => {
		if (result.isConfirmed) {
			submitFormData("parentEditForm", "?handler=EditData", "ParentEditModal");
		}
	});

	return false;
}
// Function สำหรับสร้าง HTML ของนักเรียนแต่ละคน
function createStudentHtml(student, sIndex) {

	const birthdate = student.birthdate
		? new Date(student.birthdate).toLocaleDateString('th-TH')
		: '-';

	return `
        <tr class="text-center">
            <td>${sIndex + 1}</td>
            <td>${student.userCode ? student.userCode.trim() : '-'}</td>
            <td>${student.fullName || '-'}</td>
            <td>${student.nickname || '-'}</td>
            <td>${student.currentGrade || '-'}</td>
            <td>${birthdate}</td>
        </tr>
    `;
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
				$('#loading').modal('show');
				getDatatable(); // โหลดข้อมูลใหม่
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

function submitFormData(formId, url, modalId) {
	const form = document.getElementById(formId);
	const formData = new FormData(form);

	axios.post(url, formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	})
		.then(response => {
			const data = response.data;
			if (data.success) {
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
						getDatatable();
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
let pendingNewStudents = [];
function addNewStudentToPendingList() {
	const firstName = $('#inputNewStudentFirstName').val().trim();
	const lastName = $('#inputNewStudentLastName').val().trim();

	const fullName = `${firstName}  ${lastName}`.trim();

	
	const nickname = $('#inputNewStudentNickname').val().trim();
	const birthdate = $('#inputNewStudentBirthdate').val();
	const grade = $('#inputNewStudentGrade').val().trim();

	if (!fullName) {
		Swal.fire('Error', 'กรุณากรอกชื่อ-นามสกุลนักเรียน', 'error');
		return;
	}

	const newStudent = {
		// ใช้ชื่อ Property ที่ตรงกับ C# Model สำหรับการส่งข้อมูลไปยัง API
		FullName: fullName,
		Nickname: nickname,
		Birthdate: birthdate,
		CurrentGrade: grade,
		FirstName: firstName,
		LastName: lastName,
	};

	pendingNewStudents.push(newStudent);
	renderPendingNewStudents(); // แสดงผลรายการที่เพิ่ม
	console.log(pendingNewStudents)
	// สร้าง hidden inputs สำหรับ Model Binding
	const container = $('#new-student-pending-list-hider');
	container.empty(); // ล้างก่อน render ใหม่
	pendingNewStudents.forEach((s, index) => {
		container.append(`
            <input type="hidden" name="NewStudents[${index}].FirstName" value="${s.FirstName}" />
            <input type="hidden" name="NewStudents[${index}].LastName" value="${s.LastName}" />
            <input type="hidden" name="NewStudents[${index}].Nickname" value="${s.Nickname}" />
            <input type="hidden" name="NewStudents[${index}].Birthdate" value="${s.Birthdate}" />
            <input type="hidden" name="NewStudents[${index}].Grade" value="${s.CurrentGrade}" />
        `);
	});
	// เคลียร์ฟอร์ม
	$('#inputNewStudentFirstName').val('');
	$('#inputNewStudentLastName').val('');
	$('#inputNewStudentNickname').val('');
	$('#inputNewStudentBirthdate').val('');
	$('#inputNewStudentGrade').val('');
	$('#add-student-form-area').slideUp();
}
// ฟังก์ชันแสดงรายการนักเรียนใหม่ที่รอดำเนินการ
// ฟังก์ชันแสดงรายการนักเรียนใหม่ที่รอดำเนินการในรูปแบบตาราง
function renderPendingNewStudents() {
	const container = $('#new-student-pending-list');
	container.empty();

	if (pendingNewStudents.length === 0) {
		// ไม่แสดงอะไรถ้าไม่มีรายการ
		return;
	}

	let tableHtml = `
			<p class="fw-bold text-success mb-2">นักเรียนใหม่ที่รอดำเนินการบันทึก:</p>
			<div class="table-responsive">
				<table class="table table-sm table-striped table-bordered">
					<thead class="table-success">
						<tr class="text-center">
							<th style="width: 5%;">#</th>
							<th>ชื่อ-นามสกุล</th>
							<th style="width: 15%;">ชื่อเล่น</th>
							<th style="width: 20%;">วันเกิด</th>
							<th style="width: 15%;">เกรด/ชั้น</th>
							<th style="width: 10%;">ลบ</th>
						</tr>
					</thead>
					<tbody>
		`;

	pendingNewStudents.forEach((s, i) => {
		// แปลงรูปแบบวันเกิดให้ดูง่ายขึ้น
		const displayBirthdate = s.Birthdate ? new Date(s.Birthdate).toLocaleDateString('th-TH') : '-';

		tableHtml += `
				<tr class="text-center">
					<td>${i + 1}</td>
					<td>${s.FullName}</td>
					<td>${s.Nickname || '-'}</td>
					<td>${displayBirthdate}</td>
					<td>${s.CurrentGrade || '-'}</td>
					<td>
						<button type="button" class="btn btn-sm btn-danger" onclick="removePendingStudent(${i})">
							<i class='bx bx-trash'>ลบ</i>
						</button>
					</td>
				</tr>
			`;
	});

	tableHtml += `
					</tbody>
				</table>
			</div>
		`;

	container.html(tableHtml);
}

// ฟังก์ชันลบนักเรียนจาก List ชั่วคราว (เหมือนเดิม)
function removePendingStudent(index) {
	// ลบจาก array
	pendingNewStudents.splice(index, 1);

	// render UI ในแชทปกติ
	renderPendingNewStudents();

	// update hidden inputs สำหรับ Model Binding
	const container = $('#new-student-pending-list-hider');
	container.empty();
	pendingNewStudents.forEach((s, i) => {
		container.append(`
            <input type="hidden" name="NewStudents[${i}].FirstName" value="${s.FirstName}" />
            <input type="hidden" name="NewStudents[${i}].LastName" value="${s.LastName}" />
            <input type="hidden" name="NewStudents[${i}].Nickname" value="${s.Nickname}" />
            <input type="hidden" name="NewStudents[${i}].Birthdate" value="${s.Birthdate}" />
            <input type="hidden" name="NewStudents[${i}].Grade" value="${s.Grade}" />
        `);
	});
}


$('#relationshipSelect').on('change', function () {
	const val = $(this).val();

	if (val === "Other") {
		$('#relationshipOther').show().prop('required', true);
		$('#editParentRelationship').val("");
	} else {
		$('#relationshipOther').hide().val("").prop('required', false);
		$('#editParentRelationship').val(val);
	}
});

$('#relationshipOther').on('input', function () {
	$('#editParentRelationship').val($(this).val());
});