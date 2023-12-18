import React from 'react'; 
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native"; 
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import { Calendar } from 'react-native-calendars'; 
import { useIsFocused } from '@react-navigation/native'; 
import { useState, useEffect, useRef } from 'react'; 
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { db } from '../../../firebase_config'; 
import { collection, addDoc, getDocs, where, query, onSnapshot } from 'firebase/firestore'; 

export default function ScheduleCol({navigation}) {  
  const [openSideBar, setOpenSideBar] = React.useState(); 
  const [viewSched, setViewSched] = useState(false); 
  const [refreshing, setRefreshing] = React.useState(false);  
  const [schedule, setSchedule] = useState([]); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());  
  const [selectedMonthName, setSelectedMonthName] = useState(''); 
  const [viewAllEvents, setViewAllEvents] = useState(false);

  useEffect(() => {  
    const fetchSchedule = () => {  
      try {  
        const unsubscribe = onSnapshot(collection(db, 'schedule'), (snapshot) => {  
          const scheduleData = snapshot.docs.map((doc) => {  
            const data = doc.data();  
            data.id = doc.id; // Add the 'id' property with the document ID  
            return data;  
          });  
          setSchedule(scheduleData);  
        });  
        return unsubscribe;  
      } catch (error) {  
        console.log('Error fetching schedule:', error);  
      }  
    };  
        fetchSchedule();  
    }, []);  
    const isFocused = useIsFocused();  
    useEffect(() => {  
        if(!isFocused) {  
            setOpenSideBar();  
        }  
    });  
    const onRefresh = React.useCallback(() => {  
        setRefreshing(true);  
        setTimeout(() => {  
            setRefreshing(false);  
        }, 1000);  
    }, []);  

    const onMonthChange = (month) => {
    setSelectedMonth(month.month - 1);
    const selectedMonth = new Date(month.dateString).toLocaleString('default', { month: 'long' });
    setSelectedMonthName(selectedMonth);
    setViewAllEvents(false); // Reset to show events only for the selected month
  };

    function getMarkedDates(scheduleData) { 
      const filteredScheduleData = scheduleData.filter((event) => { 
        const eventMonth = new Date(event.selectedDate).getMonth(); 
        return eventMonth === selectedMonth; 
      }); 
      return filteredScheduleData.reduce((markedDates, item) => { 
        let color = ''; 
        if (item.type === 'Collection') { 
          color = 'rgb(255, 203, 60)'; 
        } else if (item.type === 'Event') { 
          color = 'rgb(72, 229, 239)'; 
        } else if (item.type === 'Assignment') { 
          color = 'rgb(135, 255, 116)'; 
        } 
        if (markedDates[item.selectedDate]) { 
          markedDates[item.selectedDate].dots.push({ color }); 
        } else { 
          markedDates[item.selectedDate] = { 
            selected: true, 
            selectedColor: color, 
            dots: [{ color }], 
          }; 
        } 
        return markedDates; 
      }, {}); 
    } 
    function SideNavigation(navigation) {  
        return (  
            <>  
                <View style={{position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99 }}>  
                    <View style={{ width: 280, height: '100%', backgroundColor: '#ffffff', paddingBottom: 60, alignItems: 'center' }}>  
                        <TouchableOpacity style={{ position: 'absolute', left: 20, top: 30, zIndex: 99 }} onPress={() => {setOpenSideBar()}}>  
                            <Ionicons name='arrow-back' style={{ fontSize: 40, color: 'rgb(81,175,91)' }} />  
                        </TouchableOpacity>  
                        <View style={{ width: '100%', alignItems: 'center', gap: 10, marginTop: 60 }}>  
                            <Image  
                                source={require('../../../assets/E-Wayste-logo.png')}  
                                style={{width: 180, height: 161, marginBottom: 10}}  
                            />  
                            <View style={{width: '95%', height: 40, backgroundColor: 'rgb(230, 230, 230)', overflow: 'hidden', borderRadius: 10, borderWidth: 0.5}}>  
                                <TouchableOpacity activeOpacity={0.5} onPress={() => { setOpenSideBar(); navigation.navigate('profile') }}>  
                                    <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(247, 245, 243)'}}>  
                                        <Text>User Profile</Text>  
                                    </View>  
                                </TouchableOpacity>  
                            </View>  
                            <View style={{width: '95%', height: 40, backgroundColor: 'rgb(230, 230, 230)', overflow: 'hidden', borderRadius: 10, borderWidth: 0.5}}>  
                                <TouchableOpacity activeOpacity={0.5}>  
                                    <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(247, 245, 243)'}}>  
                                        <Text>Settings</Text>  
                                    </View>  
                                </TouchableOpacity>  
                            </View>  
                        </View>  
                        <View style={{position: 'absolute', width: '95%', height: 40, bottom: 80, backgroundColor: 'rgb(230, 230, 230)', overflow: 'hidden', borderRadius: 10, borderWidth: 0.5}}>  
                            <TouchableOpacity activeOpacity={0.5} onPress={() => { setOpenSideBar(); navigation.navigate('login') }}>  
                                <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(247, 245, 243)'}}>  
                                    <Text>Logout</Text>  
                                </View>  
                            </TouchableOpacity>  
                        </View>  
                    </View>  
                    <TouchableOpacity style={{position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0)', zIndex: -1}} onPress={() => {setOpenSideBar()}} />  
                </View>  
            </>  
        );  
    }  
    function ViewSchedButton(scheduleData) {  
        return (  
          <>  
            <View style={{ width: 330, marginTop: 20, alignItems: 'center' }}>  
              <View style={{width: '95%', height: 40, backgroundColor: 'rgb(230, 230, 230)', overflow: 'hidden', borderRadius: 10, borderWidth: 0.5}}>  
                <TouchableOpacity activeOpacity={0.5} onPress={() => { setViewSched(true); }}>  
                  <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(247, 245, 243)'}}>  
                    <Text>View all Events</Text>  
                  </View>  
                </TouchableOpacity>  
              </View>  
            </View>  
          </>  
        );  
      }  
      
    function getEventBackgroundColor(event) {  
      const currentDate = new Date().toISOString().substring(0, 10);  
        if (event.selectedDate === currentDate) {  
          return 'rgba(255, 203, 60, 0.5)';  
        } else if (event.type === 'Collection') {  
          return 'rgba(255, 203, 60, 0.5)';  
        } else if (event.type === 'Event') {  
          return 'rgba(72, 229, 239, 0.5)';  
        } else if (event.type === 'Assignment') {  
          return 'rgba(135, 255, 116, 0.5)';  
        }  
    } 

    function ViewSchedExtend(scheduleData) {
      const sortedScheduleData = [...scheduleData].sort((a, b) => {
        return new Date(a.selectedDate) - new Date(b.selectedDate);
      });
    
      const filteredScheduleData = viewAllEvents ? sortedScheduleData : sortedScheduleData.filter((event) => {
        const eventMonth = new Date(event.selectedDate).getMonth();
        return eventMonth === selectedMonth;
      });
    
      const handleScheduleClick = async (scheduleId) => {
        console.log('Schedule ID:', scheduleId);
        await AsyncStorage.setItem('scheduleId', scheduleId);
        navigation.navigate('viewSched', { scheduleId: scheduleId });
      };
    
      if (filteredScheduleData.length === 0) {
        return (
          <View style={{ width: 330, marginTop: 20, alignItems: 'center' }}>
            <Text style={{fontSize: 16, color: 'grey'}}>No schedules set for {selectedMonthName}</Text>
          </View>
        );
      }
    
      return (
        <>
          <View style={{ width: 315, marginTop: 20, gap: 10 }}>
            <View style={{ width: '100%', borderWidth: 0.5 }} />
            <View style={{ width: '100%', alignItems: 'flex-start' }}></View>
            {filteredScheduleData.map((event, index) => (
              <TouchableOpacity key={index} onPress={() => handleScheduleClick(event.id)}>
                <View style={{ width: '100%', flexDirection: 'row' }}>
                  <View style={{ width: 80, height: 60, borderRadius: 20, backgroundColor: getEventBackgroundColor(event), justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', position: 'absolute', top: 4 }}>
                      {new Date(event.selectedDate).toLocaleString('default', { month: 'short' })}
                    </Text>
                    <Text style={{ fontSize: 30, fontWeight: 800 }}>{event.selectedDate.substring(8, 10)}</Text>
                  </View>
    
                  <View style={{ position: 'absolute', width: 225, height: 60, borderRadius: 10, backgroundColor: getEventBackgroundColor(event), right: 0, justifyContent: 'center', paddingHorizontal: 15 }}>
                    <Text style={{ fontSize: 18, fontWeight: 800 }}>{event.type}</Text>
                    <Text>{event.startTime}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ width: 330, marginTop: 20, alignItems: 'center' }}>
            <View style={{ width: '95%', height: 40, backgroundColor: 'rgb(230, 230, 230)', overflow: 'hidden', borderRadius: 10, borderWidth: 0.5, marginBottom: 15 }}>
              <TouchableOpacity activeOpacity={0.5} onPress={() => { setViewAllEvents(!viewAllEvents); }}>
                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(247, 245, 243)' }}>
                  <Text>{viewAllEvents ? 'Show less' : 'View all events'}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </>
      );
    }
 
    return (  
      <> 
      <TouchableOpacity style={{ position: 'absolute', left: 20, top: 30, zIndex: 99 }} onPress={() => {setOpenSideBar(SideNavigation(navigation))}}> 
          <Ionicons name='menu' style={{ fontSize: 40, color: 'rgb(81,175,91)' }} /> 
      </TouchableOpacity> 
      {openSideBar} 
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={ 
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> 
      }> 
          <SafeAreaView style={styles.container}> 
              <View style={{width: '100%', flexDirection: 'row', top: 20, justifyContent: 'center', paddingTop: 14}}> 
                  <Text style={{ fontSize: 25, fontWeight: 900, color: 'rgb(81,175,91)' }}>SCHEDULE</Text> 
              </View>           
              <View style={{ marginTop: 35 }}> 
              <Calendar 
                style={{ 
                width: 320, 
                backgroundColor: 'rgb(236, 252, 238)', 
                borderRadius: 10, 
                paddingBottom: 15, 
                elevation: 4 
                }} 
                markedDates={getMarkedDates(schedule)} 
                markingType={'multi-dot'} 
                onMonthChange={onMonthChange} 
            /> 
              </View> 
              <View style={{width: 320, marginTop: 10, gap: 5}}> 
                  <View style={{ flexDirection: 'row', gap: 10 }}> 
                      <View style={{ width: 20, height: 20, backgroundColor: 'rgb(242, 190, 45)' }} /> 
                      <Text>Schedule for Collection</Text> 
                  </View> 
                  <View style={{ flexDirection: 'row', gap: 10 }}> 
                      <View style={{ width: 20, height: 20, backgroundColor: 'rgb(134, 231, 237)' }} /> 
                      <Text>Special Events</Text> 
                      </View>  
                  <View style={{ flexDirection: 'row', gap: 10 }}>  
                      <View style={{ width: 20, height: 20, backgroundColor: 'rgb(135, 255, 116)'}} />  
                      <Text>Assignment</Text>   
                  </View> 
              </View> 
              {viewSched ? ViewSchedExtend(schedule) : ViewSchedButton(schedule)}  
          </SafeAreaView> 
      </ScrollView> 
  </> 
    );  
}  
const styles = StyleSheet.create({  
    container: {  
        flex: 1,  
        flexDirection: 'column',  
        backgroundColor: 'white', 
        justifyContent: 'flex-start',  
        alignItems: 'center',  
        paddingBottom: 60,  
    },  
    body: {  
        position: 'relative',  
        width: 350,  
        paddingTop: 50,  
        paddingBottom: 10,  
        alignItems: 'center',  
    },  
})