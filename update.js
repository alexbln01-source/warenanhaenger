(function () {

    const CURRENT_VERSION = "1.0.0"; // ⚠️ gleiche Version wie in version.json

    fetch("version.json?cache=" + Date.now())
        .then(response => response.json())
        .then(data => {

            const savedVersion = localStorage.getItem("app_version");

            if (savedVersion !== data.version) {

                // Neue Version erkannt
                localStorage.setItem("app_version", data.version);

                // Cache-Break Reload
                window.location.replace(
                    window.location.pathname + "?v=" + Date.now()
                );
            }
        })
        .catch(() => {
            console.log("Update-Check nicht möglich");
        });

})();