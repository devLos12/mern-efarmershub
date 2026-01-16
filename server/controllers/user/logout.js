
const Logout = (req, res) => {
    // Check if local or production
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
    const isLocal = allowedOrigins.some(origin => 
        origin.includes('localhost') || origin.startsWith('http://')
    );

    // Cookie options - same as CookieSetUp
    const cookieOptions = {
        httpOnly: true,
        secure: !isLocal,
        sameSite: isLocal ? 'lax' : 'none',
        path: "/"
    };

    // Clear cookies with proper options
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({ message: "Successfully Logout" });
};

export default Logout;