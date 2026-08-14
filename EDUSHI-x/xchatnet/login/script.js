
        function openLoginModal() {
            document.getElementById('loginModal').classList.add('active');
        }

        function closeLoginModal() {
            document.getElementById('loginModal').classList.remove('active');
        }

        function showErrorModal() {
            document.getElementById('errorModal').classList.add('active');
        }

        function closeErrorModal() {
            document.getElementById('errorModal').classList.remove('active');
            openLoginModal();
        }

        function handleLoginSubmit(event) {
            event.preventDefault();
            const keyInput = document.getElementById('digitKey').value;
            
            closeLoginModal();

            // Test Key: "123456"
            if (keyInput === "123456") {
                alert("Login Successful! Welcome to TALKY.");
            } else {
                showErrorModal();
            }
        }
    