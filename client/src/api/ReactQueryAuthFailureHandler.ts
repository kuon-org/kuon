import queryClient from "../utils/queryClient";
import type { AuthFailureHandler } from "./FetchHttpClient/AuthFailureHandler";

class ReactQueryAuthFailureHandler implements AuthFailureHandler {
  handleAuthFailure() {
    queryClient.setQueryData(["authUser"], null);
  }
}
const authFailureHandler = new ReactQueryAuthFailureHandler();
export default authFailureHandler;
