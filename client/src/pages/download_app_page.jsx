import { useEffect } from "react";

const Download_Rider_App = () => {

    const APK_LINK = "https://github.com/devLos12/mern-efarmerShub/releases/download/v1.0.0/application-7121180f-4c5d-48ad-b8bd-c04602f61679.apk";

    useEffect(() => {
        const a = document.createElement("a");
        a.href = APK_LINK;
        a.download = "EFarmersHub-Rider.apk";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // balik sa email after trigger ng download
        setTimeout(() => {
            window.history.back();
        }, 2000);
    }, []);

    return null

}

export default Download_Rider_App;