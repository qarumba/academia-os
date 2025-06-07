import { createStore, combineReducers } from "redux"
import tabsReducer from "./tabsReducer"
import modelReducer from "../Components/modelSlice" // Import from Components directory

const rootReducer = combineReducers({
  tabs: tabsReducer,
  model: modelReducer,
})

const store = createStore(rootReducer)
export default store
export type RootState = ReturnType<typeof rootReducer>
