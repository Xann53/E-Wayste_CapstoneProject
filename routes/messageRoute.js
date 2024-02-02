import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Message from '../app/messageTabs/messagePage';
import NewMessage from '../app/messageTabs/createMessage';
import ViewMessage from '../app/messageTabs/chatView';

const Tab = createBottomTabNavigator();

export default function MessageLayout() {
    return (
        <Tab.Navigator initialRouteName='messageRoutes'>
            <Tab.Screen name='message' component={Message} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
            <Tab.Screen name='createMessage' component={NewMessage} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
            <Tab.Screen name='chatView' component={ViewMessage} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
        </Tab.Navigator>
    );
}