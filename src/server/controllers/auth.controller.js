import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res, next) => {
  const { name, email, password, terms } = req.body;
  if (!terms)
    res
      .status(400)
      .send(
        errorHandler(
          false,
          400,
          "Terms and conditions are required",
        ),
      );
  const validUser = await User.findOne({ email });
  
  if (validUser) {
    next(errorHandler(false, 401, "User already exist"));
  } else {
    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });
    try {
      await newUser.save();
      res
        .status(201)
        .send({ message: "User created successfully" });
    } catch (err) {
      console.error(err);
      next(errorHandler(false, 500, "Something went wrong"));
    }
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const validUser = await User.findOne({ email });
    const validPassword = bcryptjs.compareSync(
      password,
      validUser.password,
    );
    if (!validUser || !validPassword)
      return next(
        errorHandler(false, 401, "Invalid username or password"),
      );
    const token = jwt.sign(
      {
        id: validUser._id,
      },
      process.env.JWT_SECRET,
    );
    const { password: hashedPassword, ...rest } = validUser._doc;
    res
      .cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

export const signout = (req, res) => {
  res
    .clearCookie("access_token")
    .status(200)
    .send({ message: "Signed out successfully!" });
};
