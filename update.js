(function () {

    fetch("version.json?nocache=" + Date.now(), {
        cache: "no-store"(function () {

    const CHECK_URL = "version.json?v=" + Date.now();

    fetch(CHECK_URL, { cache: "no-store" })
        .then(res => res.json())
        .then(data => {

            const currentVersion = localStorage.getItem("app_version");

            if (currentVersion !== data.version) {

                localStorage.setItem("app_version", data.version);

                // 🔥 kompletter Hard Reload der App
                window.location.href =
                    window.location.origin +
                    window.location.pathname +
                    "?update=" + Date.now();
            }

        })
        .catch(() => {
            console.log("Update Check fehlgeschlagen");
        });

})();
    })
    .then(response => response.json())
    .then(data => {

        const savedVersion = localStorage.getItem("app_version");

        if (savedVersion !== data.version) {

            localStorage.setItem("app_version", data.version);

            window.location.href =
                window.location.pathname + "?reload=" + Date.now();
        }
    })
    .catch(() => {});

})();
