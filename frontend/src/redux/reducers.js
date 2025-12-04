import { combineReducers } from "redux";
import authSlice from "./reducers/authSlice";
import sessionSlice from "./reducers/sessionSlice";

const reducers = {
  auth: authSlice,
  session: sessionSlice,
};

export default combineReducers(reducers);
