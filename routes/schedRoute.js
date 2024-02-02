import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Schedule from '../app/schedTabsUser/schedPage';
import ViewSchedDetailsUsers from '../app/schedTabsUser/viewShedules';

const Tab = createBottomTabNavigator();

export default function SchedUserLayout() {
    return (
        <Tab.Navigator initialRouteName='mainSched'>
            <Tab.Screen name='mainSched' component={Schedule} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
            <Tab.Screen name='viewSched' component={ViewSchedDetailsUsers} options={{headerShown: false, tabBarStyle:{display:'none'}}} />
        </Tab.Navigator>
    );
}