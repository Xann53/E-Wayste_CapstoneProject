import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ScheduleAut from '../app/schedTabsAut/schedPageA';
import AddSched from '../app/schedTabsAut/createSched';
import ViewSchedDetails from '../app/schedTabsAut/viewSched';

const Tab = createBottomTabNavigator();

export default function SchedLayout() {
    return (
        <Tab.Navigator initialRouteName='mainSched'>
            <Tab.Screen name='mainSched' component={ScheduleAut} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
            <Tab.Screen name='addSched' component={AddSched} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
            <Tab.Screen name='viewSched' component={ViewSchedDetails} options={{headerShown: false, tabBarStyle:{display:'none'}}}/>
        </Tab.Navigator>
    );
}