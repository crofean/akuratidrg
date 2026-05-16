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

        // Simulate form processing
        const submitBtn = form.querySelector('.btn-submit');
        const originalBtnText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>MEMPROSES...</span> <i class="animate-spin" data-lucide="refresh-cw"></i>';
        lucide.createIcons();

        setTimeout(() => {
            const fullName = document.getElementById('fullName').value;
            displayUserName.textContent = fullName;
            
            modal.style.display = 'flex';
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            lucide.createIcons();
            
            form.reset();
            agreementStatus.textContent = 'Belum Disetujui';
            agreementStatus.classList.remove('active');
        }, 2000);
    });
});

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('successModal');
    if (event.target == modal) {
        closeModal();
    }
}
