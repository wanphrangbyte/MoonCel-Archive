document.addEventListener("DOMContentLoaded", async () => {

    const token =
        localStorage.getItem("token");



    if (!token) {

        window.location.href =
            "login.html";

        return;

    }



    try {

        const response = await fetch(

            "http://localhost:5000/reality-marble-access",

            {

                method: "GET",

                headers: {

                    Authorization:
                        `Bearer ${token}`

                }

            }

        );



        const data =
            await response.json();



        console.log(data);



        if (data.access) {

            alert(
                "Reality Marble Activated"
            );



            // SHOW REALITY MARBLE UI

            document
                .getElementById("realityMarble")
                .style.display = "block";

        }



        else {

            alert(
                "Reality Marble Cooling Down"
            );



            // SKIP TO SHOP SECTION

            document
                .getElementById("shopSection")
                .style.display = "block";

        }

    }



    catch (error) {

        console.log(error);

    }

});