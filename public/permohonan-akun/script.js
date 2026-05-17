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

    // Password Toggle Visibility
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                btn.innerHTML = '<i data-lucide="eye-off"></i>';
            } else {
                passwordInput.type = 'password';
                btn.innerHTML = '<i data-lucide="eye"></i>';
            }
            lucide.createIcons();
        });
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

        // Strong Password Validation (8+ chars, uppercase, lowercase, number, symbol)
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[^a-zA-Z0-9]/.test(password);

        if (password.length < 8 || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
            alert('Kata sandi tidak memenuhi standar keamanan! Kata sandi harus memuat:\n' +
                  '• Minimal 8 karakter\n' +
                  '• Minimal 1 huruf besar (A-Z)\n' +
                  '• Minimal 1 huruf kecil (a-z)\n' +
                  '• Minimal 1 angka (0-9)\n' +
                  '• Minimal 1 karakter spesial/simbol (contoh: @, #, $, !, %, *, dsb.)');
            return;
        }

        // Actual submission function
        const submitRegistrationForm = () => {
            // REAL SUBMISSION TO GOOGLE SHEETS
            const scriptURL = 'https://script.google.com/macros/s/AKfycbzIJd7V5NkJIFJ44MLb9IS9QpDauTClCulaZ2ahTHOWdsG4Drp-jBjiRcRw6BZr8thC/exec';
            
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
                agreementCheckbox.checked = false;
                agreementStatus.textContent = 'Belum Disetujui';
                agreementStatus.classList.remove('active');
                closeModal('termsModal');
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
        };

        if (!agreementCheckbox.checked) {
            // Tampilkan syarat dan ketentuan dahulu sebelum kirim!
            isSubmittingFromForm = true;
            document.getElementById('btnTermsCancel').textContent = 'Tolak';
            document.getElementById('btnTermsAccept').textContent = 'Setujui & Kirim Pengajuan';
            document.getElementById('termsModal').style.display = 'flex';
            return;
        }

        submitRegistrationForm();
    });

    // Terms Modal Buttons Listeners
    document.getElementById('btnTermsAccept').addEventListener('click', () => {
        agreementCheckbox.checked = true;
        agreementStatus.textContent = 'Ya, Saya Setuju';
        agreementStatus.classList.add('active');

        if (isSubmittingFromForm) {
            // Tunggu sebentar agar perubahan checkbox terlihat visual
            setTimeout(() => {
                const form = document.getElementById('registrationForm');
                // Trigger form submission
                const submitBtnElement = form.querySelector('.btn-submit');
                submitBtnElement.click();
            }, 150);
        } else {
            closeModal('termsModal');
        }
    });

    document.getElementById('btnTermsCancel').addEventListener('click', () => {
        agreementCheckbox.checked = false;
        agreementStatus.textContent = 'Belum Disetujui';
        agreementStatus.classList.remove('active');
        isSubmittingFromForm = false;
        closeModal('termsModal');
    });
});

let isSubmittingFromForm = false;

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Terms Modal Logic
document.getElementById('termsLink').addEventListener('click', () => {
    isSubmittingFromForm = false;
    document.getElementById('btnTermsCancel').textContent = 'Tutup';
    document.getElementById('btnTermsAccept').textContent = 'Saya Setuju';
    document.getElementById('termsModal').style.display = 'flex';
});

// Close modal when clicking outside
window.onclick = function(event) {
    const successModal = document.getElementById('successModal');
    const termsModal = document.getElementById('termsModal');
    if (event.target == successModal) closeModal('successModal');
    if (event.target == termsModal) closeModal('termsModal');
}
