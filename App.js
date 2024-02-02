import Layout1 from "./routes/route1";
import registerNNPushToken from "native-notify";
import Manage from "./app/managePage";

export default function App() {
    registerNNPushToken(18226, 'e3rUIe7b50DlmEkB0TkOEK');
    return (
        <>
            <Layout1/>
            {/* <Manage /> */}
        </>
    );
};