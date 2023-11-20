import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Message from './messagePage';

const Tab = createBottomTabNavigator();

export default function MessageLayout() {
    return (
        <Tab.Navigator initialRouteName='message'>
            <Tab.Screen name='message' component={Message} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
        </Tab.Navigator>
    );
}