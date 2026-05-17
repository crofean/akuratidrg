document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const agreementCheckbox = document.getElementById('agreement');
    const agreementStatus = document.getElementById('agreementStatus');
    const modal = document.getElementById('successModal');
    const displayUserName = document.getElementById('displayUserName');

    // Update agreement status badge
    agreementCheckbox.addEventListener('change', () => {
        if (agreementCheckbox.checked) {
            agreementStatus.textContent = 'Ya, Saya Setuju';
            agreementStatus.classList.add('active');
        } else {
            agreementStatus.textContent = 'Belum Disetujui';
            agreementStatus.classList.remove('active');
        }
    });

    // Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Basic Validations
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Kata sandi tidak cocok! Harap ulangi konfirmasi kata sandi.');
            return;
        }

        if (password.length < 8) {
            alert('Kata sandi minimal harus 8 karakter.');
            return;
        }

        if (!agreementCheckbox.checked) {
            alert('Harap setujui Syarat dan Ketentuan untuk melanjutkan.');
            return;
        }

        // REAL SUBMISSION TO GOOGLE SHEETS
        const scriptURL = 'https://script.google.com/macros/s/AKfycbyChScgs4N8u2wLV8y7fFRj7jyNrUlyPVrarBWfIHToVWqrl3svMD3zZleOEg5je9Qt/exec';
        
        const submitBtn = form.querySelector('.btn-submit');
        const originalBtnText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>MENGIRIM...</span> <i class="animate-spin" data-lucide="refresh-cw"></i>';
        lucide.createIcons();

        const formData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            rsCode: document.getElementById('rsCode').value,
            rsName: document.getElementById('rsName').value,
            position: document.getElementById('position').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            questionType: document.getElementById('questionType').value
        };

        const formDataObj = new FormData();
        for (const key in formData) {
            formDataObj.append(key, formData[key]);
        }

        fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            body: formDataObj
        })
        .then(() => {
            console.log('Submission attempt finished');
            displayUserName.textContent = formData.fullName;
            modal.style.display = 'flex';
            form.reset();
            agreementStatus.textContent = 'Belum Disetujui';
            agreementStatus.classList.remove('active');
            lucide.createIcons();
        })
        .catch(error => {
            console.error('Submission error:', error);
            alert('Terjadi kesalahan saat mengirim permohonan.');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            lucide.createIcons();
        });
    });
});

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Terms Modal Logic
document.getElementById('termsLink').addEventListener('click', () => {
    document.getElementById('termsModal').style.display = 'flex';
});

// Close modal when clicking outside
window.onclick = function(event) {
    const successModal = document.getElementById('successModal');
    const termsModal = document.getElementById('termsModal');
    if (event.target == successModal) closeModal('successModal');
    if (event.target == termsModal) closeModal('termsModal');
}
