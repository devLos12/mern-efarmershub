
const Logout = ( req, res) =>{
    res.clearCookie("accessToken", { path: "/"});
    res.clearCookie("refreshToken", { path: "/"});

    res.status(200).json({ message: "Successfully Logout"});
}

export default Logout;