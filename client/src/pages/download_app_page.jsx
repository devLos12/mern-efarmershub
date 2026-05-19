import { useEffect } from "react";

const Download_Rider_App = () => {


    const APK_LINK = "https://github.com/devLos12/mern-efarmershub/releases/download/v1.0.0/application-fbb31280-02ef-439e-b834-d627c9e98330.apk"

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