import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";

import ManagePageStat from "../components/ManageStat";
import ManageNav from "../components/ManagePageNav";

export default function Manage() {
    const [data, setData] = useState();

    const Test = async(msg) => {
        setData(msg)
    }

    return (
        <>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{width: '100%', height: '100%'}}>
                <View style={{display: 'flex', flex: 1, width: '100%', alignItems: 'center', paddingTop: 80}}>
                    <View style={{display: 'flex', flex: 1, width: '87%', gap: 10}}>
                        <ManagePageStat />
                        <ManageNav NavFunction={Test} />
                        <View style={{display: 'flex', flex: 1, backgroundColor: '#E4EDE5', alignItems: 'center', borderRadius: 10, padding: 10}}>
                            <Text>{data}</Text>
                        </View>
                    </View>
                    <View style={{display: 'flex', flex: 1, position: 'absolute', zIndex: -10, width: '100%', height: 252, backgroundColor: 'rgb(220, 130, 47)'}}>
                        <View style={{width: '100%', height: '90%', backgroundColor: 'rgb(134, 202, 81)', overflow: 'hidden', alignItems: 'center'}}>
                            <Image
                                source={require('../assets/NatureVector.jpg')}
                                style={{
                                    resizeMode: 'stretch',
                                    width: '100%',
                                    height: '150%',
                                    opacity: 0.5,
                                }}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </>
    );
}