(function () {

    fetch("version.json?ts=" + Date.now(), { cache: "reload" })
        .then(response => response.json())
        .then(data => {

            const storedVersion = localStorage.getItem("app_version");

            if (storedVersion !== data.version) {

                localStorage.setItem("app_version", data.version);

                // 🔥 Vollständiger Reload mit Cache-Break
                window.location.replace(
                    window.location.origin +
                    window.location.pathname +
                    "?v=" + Date.now()
                );
            }

        })
        .catch(() => {
            console.log("Update-Check fehlgeschlagen");
        });

})();
