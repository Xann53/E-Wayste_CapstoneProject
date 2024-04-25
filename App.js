import Layout1 from "./routes/route1";
import registerNNPushToken from "native-notify";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image, Modal, StatusBar } from "react-native";

export default function App() {
    registerNNPushToken(18226, 'e3rUIe7b50DlmEkB0TkOEK');
    return (
        <SafeAreaView style={{flex: 1}}>
            <View style={{display: 'flex', flex: 1, width: '100%', height: '100%'}}>
                <StatusBar backgroundColor="black" hidden />
                <Layout1/>
            </View>
        </SafeAreaView>
    );
};