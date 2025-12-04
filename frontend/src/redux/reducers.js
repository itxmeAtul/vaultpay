import { combineReducers } from "redux";
import authSlice from "./reducers/authSlice";
import sessionSlice from "./reducers/sessionSlice";
import userSlice from "./reducers/userSlice";

const reducers = {
  auth: authSlice,
  session: sessionSlice,
  users: userSlice,
};

export default combineReducers(reducers);
