(function () {

    fetch("version.json?nocache=" + Date.now(), {
        cache: "no-store"
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
