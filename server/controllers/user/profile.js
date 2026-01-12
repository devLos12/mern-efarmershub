import User from "../../models/user.js";

export const getUserInfo = async (req, res) => {
  try {
    // const id = req.params.id;  
    

    const userId = req.account.id;

    const user = await User.findOne({_id : userId});
    
    if(!user){
      return res.status(401).json({ message: "User not found!"});
    }
    
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message : err.message});
  }
};
