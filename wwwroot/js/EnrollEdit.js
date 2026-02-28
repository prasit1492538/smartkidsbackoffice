function openEditPaymentModal(studentId, studentName) {
    // ล้างค่าเก่าในฟอร์ม (Reset)
    document.getElementById('paymentForm').reset();
    // นำค่าไปใส่ใน Modal Input
    document.getElementById('modalStudentId').value = studentId;
    document.getElementById('modalStudentName').value = studentName;

    

    // ล้างการ Preview รูปภาพ
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    if (previewContainer) previewContainer.style.display = 'none';
    if (imagePreview) imagePreview.src = '#';

    // ตรวจสอบการแสดงผลช่องแนบรูป (เผื่อกรณี Default เป็น Cash)
    toggleAttachment();

    // แสดง Modal (Bootstrap 5)
    var myModal = new bootstrap.Modal(document.getElementById('paymentModal'));
    myModal.show();
}

// ฟังก์ชันซ่อน/แสดงช่องแนบรูปภาพ
function toggleAttachment() {
    const method = document.getElementById('paymentMethod').value;
    const attachmentSection = document.getElementById('attachmentSection');

    if (method === 'Transfer') {
        attachmentSection.style.display = 'block';
    } else {
        attachmentSection.style.display = 'none';
        document.getElementById('paymentProof').value = ''; // ล้างไฟล์ที่เลือกไว้ถ้าเปลี่ยนกลับไปเป็นเงินสด
        document.getElementById('previewContainer').style.display = 'none';
    }
}

// แสดงตัวอย่างรูปภาพเมื่อเลือกไฟล์
document.getElementById('paymentProof').onchange = evt => {
    const [file] = document.getElementById('paymentProof').files;
    if (file) {
        document.getElementById('previewContainer').style.display = 'block';
        document.getElementById('imagePreview').src = URL.createObjectURL(file);
    }
}
document.getElementById('paymentForm').onsubmit = function (e) {
    e.preventDefault();
    Swal.fire({
        title: 'สำเร็จ!',
        text: 'ทำรายการจ่ายเงินเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง'
    }).then((result) => {
        if (result.isConfirmed) {
            location.reload(); // รีเฟรชหน้าเมื่อกดปุ่มตกลง
        }
    });
};