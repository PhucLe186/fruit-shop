/*=====================
      Color Picker
==========================*/
function initColorPicker() {
    var colorPickElement = document.getElementById("colorPick");
    if (colorPickElement) {
        var color_picker1 = colorPickElement.value;
        colorPickElement.onchange = function () {
            color_picker1 = this.value;
            document.body.style.setProperty("--theme-color", color_picker1);
            document.body.style.setProperty("--theme-color-rgb", color_picker1);
        };
    }
}

// Export function to window
window.initColorPicker = initColorPicker;

/*========================
 Dark setting js
 ==========================*/
function initDarkSetting() {
    if (typeof $ !== 'undefined') {
        $("#darkButton").off("click").on("click", function () {
            var href = $("#color-link").attr("href");
            $("body").removeClass("light");
            $("body").addClass("dark");
            var colorLink = document.getElementById("color-link");
            if (colorLink) {
                colorLink.setAttribute("href", "../assets/css/dark.css");
            }
        });

        $("#lightButton").off("click").on("click", function () {
            var href = $("#color-link").attr("href");
            $("body").removeClass("dark");
            $("body").addClass("light");
            var colorLink = document.getElementById("color-link");
            if (colorLink) {
                colorLink.setAttribute("href", "../assets/css/style.css");
            }
        });
    }
}

// Export function to window
window.initDarkSetting = initDarkSetting;

/*========================
   RTL setting js
   ==========================*/
function initRTLSetting() {
    if (typeof $ !== 'undefined') {
        $(".rtl").off("click").on("click", function () {
            if ($("body").hasClass("ltr")) {
                $("html").attr("dir", "rtl");
                $("body").removeClass("ltr");
                $("body").addClass("rtl");
                $("#rtl-link").attr("href", "../assets/css/vendors/bootstrap.rtl.css");
            } else {
                $("html").attr("dir", "");
                $("body").removeClass("rtl");
                $("body").addClass("ltr");
                $("#rtl-link").attr("href", "../assets/css/vendors/bootstrap.css");
            }
        });
    }
}

// Export function to window
window.initRTLSetting = initRTLSetting;