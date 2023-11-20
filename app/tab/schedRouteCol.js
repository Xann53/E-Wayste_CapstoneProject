import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ScheduleCol from './schedTabsUser/schedPage';
import ViewSchedDetailsCol from './schedTabsCol/viewShedules';

const Tab = createBottomTabNavigator();

export default function SchedColLayout() {
    return (
        <Tab.Navigator initialRouteName='mainSched'>
            <Tab.Screen name='mainSched' component={ScheduleCol} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
            <Tab.Screen name='viewSched' component={ViewSchedDetailsCol} options={{headerShown: false, tabBarStyle:{display:'none'}}} />
        </Tab.Navigator>
    );
}