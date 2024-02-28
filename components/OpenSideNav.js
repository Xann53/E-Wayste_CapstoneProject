import * as React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import SessionStorage from 'react-native-session-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

import SideBar from './SideNav';

export default function OpenSideBar({navigation, close}) {
    return (
        <>
            <View style={{position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99}}>
                <TouchableOpacity style={{ position: 'absolute', left: 20, top: 30, zIndex: 150 }} onPress={() => {close()}}>
                    <Ionicons name='arrow-back' style={{ fontSize: 40, color: 'rgb(81,175,91)' }} />
                </TouchableOpacity>
                {SideBar(navigation)}
                <TouchableOpacity style={{position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0)', zIndex: -1}} onPress={() => {close()}} />
            </View>
        </>
    );
}