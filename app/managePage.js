import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from '@react-navigation/native';

import OpenSideBar from "../components/OpenSideNav";
import ManagePageStat from "../components/ManageStat";
import ManageNav from "../components/ManagePageNav";
import ColManageList from "../components/CollectorManageList";
import TrkManageList from "../components/TruckManageList";
import PndManageList from "../components/PendingManageList";
import AddTruck from "../components/AddTruckForm";
import DisplayWorkID from "../components/ViewID";
import DisplayUserAcc from "../components/ViewUserAccForm";
import TruckInfo from "../components/ViewTruckInfo";

export default function Manage({ navigation }) {
    const isFocused = useIsFocused();
    const [navData, setNavData] = useState('Collectors');
    const [openSideBar, setOpenSideBar] = useState();
    const [openAddTruck, setOpenAddTruck] = useState();
    const [viewAcc, setViewAcc] = useState();
    const [image, setImage] = useState();
    const [viewTruck, setViewTruck] = useState();

    const [colNo, setColNo] = useState(0);
    const [pendingNo, setPendingNo] = useState(0);
    const [truckNo, setTruckNo] = useState(0);

    const NavTo = async(temp) => {
        setNavData(temp)
    }

    const setColNoFunction = async(temp) => {
        setColNo(temp);
    }

    const setPendingNoFunction = async(temp) => {
        setPendingNo(temp);
    }

    const setTruckNoFunction = async(temp) => {
        setTruckNo(temp);
    }

    const setImageFunction = async(temp) => {
        setImage(temp);
    }

    const setViewAccFunction = async(temp) => {
        setViewAcc(temp);
    }

    const setViewTruckFunction = async(temp) => {
        setViewTruck(temp);
    }

    useEffect(() => {
        if(!isFocused) {
            setOpenSideBar();
        }
    });

    function SideNavigation(navigation) {
        const closeSideNav = async() => {
            setOpenSideBar();
        }

        return (
            <OpenSideBar navigation={navigation} close={closeSideNav} />
        );
    }

    function AddTruckFunction() {
        const closeAddTruck = async() => {
            setOpenAddTruck();
        }

        return (
            <AddTruck close={closeAddTruck} />
        );
    }

    return (
        <>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{width: '100%', height: '100%'}}>
                <View style={{display: 'flex', flex: 1, width: '100%', alignItems: 'center', paddingTop: 80, paddingBottom: 50}}>
                    <TouchableOpacity activeOpacity={0.5} style={{ position: 'absolute', left: 20, top: 30, zIndex: 3 }} onPress={() => {setOpenSideBar(SideNavigation(navigation))}}>
                        <Ionicons name='menu' style={{ fontSize: 40, color: '#ffffff' }} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.5} style={{ position: 'absolute', right: 20, top: 31, zIndex: 3 }} onPress={() => {navigation.navigate('notification')}}>
                        <Ionicons name='notifications' style={{ fontSize: 35, color: '#ffffff' }} />
                    </TouchableOpacity>
                    <View style={{display: 'flex', flex: 1, width: '87%', gap: 10}}>
                        <ManagePageStat navData={navData}  NavFunction={NavTo} setColNoFunction={setColNoFunction} setPendingNoFunction={setPendingNoFunction} setTruckNoFunction={setTruckNoFunction} />
                        <ManageNav navData={navData}  NavFunction={NavTo} />
                        {((navData === 'Collectors' && colNo > 0) || (navData === 'Trucks' && truckNo > 0) || (navData === 'Pending' && pendingNo > 0)) &&
                            <View style={{backgroundColor: '#E4EDE5', alignItems: 'center', borderRadius: 10, padding: 10}}>
                                {navData === 'Collectors' && <ColManageList setViewAccFunction={setViewAccFunction} />}
                                {navData === 'Trucks' && <TrkManageList setViewTruckFunction={setViewTruckFunction} />}
                                {navData === 'Pending' && <PndManageList setViewAccFunction={setViewAccFunction} />}
                            </View>
                        }
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
            {openSideBar}
            {navData === 'Trucks' &&
                <View style={{ position: 'absolute', right: 20, bottom: 70, zIndex: 1, height: 60, width: 60, borderRadius: 100, backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgb(81,175,91)', overflow: 'hidden' }}>
                    <TouchableOpacity activeOpacity={0.5} onPress={() => {setOpenAddTruck(AddTruckFunction())}}>
                        <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                            <Ionicons name='add-circle' style={{ fontSize: 60, color: 'rgb(81,175,91)', top: -3, right: -0.9 }} />
                        </View>
                    </TouchableOpacity>
                </View>
            }
            {openAddTruck}
            {viewAcc !== undefined && <DisplayUserAcc accID={viewAcc} setViewAccFunction={setViewAccFunction} setImageFunction={setImageFunction} />}
            {image !== undefined && <DisplayWorkID imageLink={image} setImageFunction={setImageFunction} />}
            {viewTruck !== undefined && <TruckInfo truckID={viewTruck} setViewTruckFunction={setViewTruckFunction} currentPage={'Manage Page'} />}
        </>
    );
}