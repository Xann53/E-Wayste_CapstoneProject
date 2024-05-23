import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LandingLayout from "./landingRoute";
import UserLayout from "./userRoute";
import CollectorLayout from "./collectorRoute";
import AuthorityLayout from "./authorityRoute";
import RepresentativeLayout from "./barangayRepRoute";

const Stack = createNativeStackNavigator();

export default function Layout1() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name='landingRoute' component={LandingLayout} options={{ headerShown: false }} />
                <Stack.Screen name='userRoute' component={UserLayout} options={{ headerShown: false }} />
                <Stack.Screen name='collectorRoute' component={CollectorLayout} options={{ headerShown: false }} />
                <Stack.Screen name='authorityRoute' component={AuthorityLayout} options={{ headerShown: false }} />
                <Stack.Screen name='barangayRepRoute' component={RepresentativeLayout} options={{ headerShown: false }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};