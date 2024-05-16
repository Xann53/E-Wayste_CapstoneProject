import React, { useState, useEffect } from 'react'; 
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, RefreshControl, Image } from 'react-native'; 
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import { Calendar } from 'react-native-calendars'; 
import { useIsFocused } from '@react-navigation/native';
import { db } from '../../firebase_config';
import { fetchUserId } from '../../components/userService';
import { parse } from 'date-fns';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc} from 'firebase/firestore';
import OpenSideBar from '../../components/OpenSideNav';

export default function ScheduleAut({ navigation }) {
  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);
  const [openSideBar, setOpenSideBar] = useState(false);
  const [viewSched, setViewSched] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [reportsToday, setReportsToday] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [userMunicipality, setUserMunicipality] = useState('');

  const currentDateForTask = new Date().toISOString().substring(0, 10); 

  useEffect(() => {
    const fetchMunicipality = async () => {
      try {
        const userId = await fetchUserId();
        if (userId) {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const municipality = userDoc.data().municipality;
            setUserMunicipality(municipality);
            console.log('Municipality of the logged-in user:', municipality);
          } else {
            console.log('User document not found.');
          }
        } else {
          console.log('User ID not found.');
        }
      } catch (error) {
        console.error('Error fetching municipality:', error);
      }
    };

    fetchMunicipality();
  }, []);

  useEffect(() => {
    const currentDate = new Date().toISOString().split('T')[0]; 
    const fetchReports = async () => {
        try {
            const todayQuery = query(collection(db, 'generalUsersReports'), where('dateTime', '>=', currentDate));
            const todaySnapshot = await getDocs(todayQuery);
            const todayReports = [];

            todaySnapshot.forEach(doc => {
                const report = doc.data();
                const reportDate = parse(report.dateTime, 'yyyy/MM/dd hh:mm:ss a', new Date());

                if (report.municipality === userMunicipality && reportDate.toISOString().split('T')[0] === currentDate) {
                    todayReports.push(report);
                }
            });

            setReportsToday(todayReports.length);

            const allReportsQuery = query(collection(db, 'generalUsersReports'), where('municipality', '==', userMunicipality));
            const allReportsSnapshot = await getDocs(allReportsQuery);
            const totalReportsCount = allReportsSnapshot.size;
            setTotalReports(totalReportsCount);
        } catch (error) {
            console.log('Error fetching reports:', error);
        }
    };

    fetchReports();
}, [userMunicipality]); 


  useEffect(() => {
    fetchSchedule(); 
  }, [userMunicipality]);
  
  const fetchSchedule = () => {
    try {
      const unsubscribe = onSnapshot(collection(db, 'schedule'), (snapshot) => {
        const scheduleData = snapshot.docs.map((doc) => {
          const data = doc.data();
          data.id = doc.id;
          return data;
        })
        .filter((schedule) => {
          const locationIncludesUserMunicipality = schedule.location && schedule.location.includes(userMunicipality);
          const collectionRouteIncludesUserMunicipality = schedule.collectionRoute && schedule.collectionRoute.coordinates.some(coord => coord.locationName && coord.locationName.includes(userMunicipality));
          return locationIncludesUserMunicipality || collectionRouteIncludesUserMunicipality;
        });

        let collectionCount = 0;
        let eventCount = 0;
        let assignmentCount = 0;
  
        scheduleData.forEach(schedule => {
          if (schedule.type === 'Collection') {
            collectionCount++;
          } else if (schedule.type === 'Event') {
            eventCount++;
          } else if (schedule.type === 'Assignment') {
            assignmentCount++;
          }
        });
  
        console.log('Collection Count:', collectionCount);
        console.log('Event Count:', eventCount);
        console.log('Assignment Count:', assignmentCount);
  
        setSchedule(scheduleData);
      });
      return unsubscribe;
    } catch (error) {
      console.log('Error fetching schedule:', error);
    }
  };
  
  
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

  const onRefresh = React.useCallback(() => { 
    setRefreshing(true); 
    setTimeout(() => { 
      setRefreshing(false); 
    }, 1000); 
  }, []); 

  function getMarkedDates(scheduleData) { 
    return scheduleData.reduce((markedDates, item) => { 
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
  
  function ViewSchedButton({ scheduleData }) { 
    return ( 
      <> 
        <View style={{ width: 330, marginTop: 20, alignItems: 'center' }}> 
          <View 
            style={{ 
              width: '95%', 
              height: 40, 
              backgroundColor: 'rgb(230, 230, 230)', 
              overflow: 'hidden', 
              borderRadius: 10, 
              borderWidth: 0.5, 
            }} 
          > 
            <TouchableOpacity activeOpacity={0.5} onPress={() => { setViewSched(true); }}> 
              <View 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  backgroundColor: 'rgb(247, 245, 243)', 
                }} 
              > 
                <Text>View all Schedules</Text> 
              </View> 
            </TouchableOpacity> 
          </View> 
        </View> 
      </> 
    ); 
  } 

  function ViewSchedExtend({ scheduleData }) {
    const sortedScheduleData = [...scheduleData].sort((a, b) => {
      return new Date(a.selectedDate) - new Date(b.selectedDate);
    });

    const filteredScheduleData = sortedScheduleData.filter((event) => {
      const eventMonth = new Date(event.selectedDate).getMonth();
      return eventMonth === selectedMonth;
  });
  
    return ( 
      <> 
        <View style={{ width: 315, marginTop: 20, gap: 10 }}> 
          <View style={{ width: '100%', borderWidth: 0.5 }} /> 
          {filteredScheduleData.map((event, index) => ( 
            <TouchableOpacity 
              key={index} 
              onPress={() => navigation.navigate('viewSched', { scheduleId: event.id })} 
            > 
              <View style={{ width: '100%', flexDirection: 'row' }}>
                <View 
                  style={{ 
                    width: 80, 
                    height: 60, 
                    borderRadius: 20, 
                    backgroundColor: getEventBackgroundColor(event), 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    borderWidth: event.selectedDate === currentDateForTask ? 2.5 : 1,
                    borderColor: event.selectedDate === currentDateForTask ? '#DFBD08' : 'black'
                  }} 
                > 
                  <Text style={{ fontSize: 30, fontWeight: 800 }}> 
                    {event.selectedDate.substring(8, 10)} 
                  </Text> 
                </View> 
                <View 
                  style={{ 
                    position: 'absolute', 
                    width: 225, 
                    height: 60, 
                    borderRadius: 10, 
                    backgroundColor: getEventBackgroundColor(event), 
                    right: 0, 
                    justifyContent: 'center', 
                    paddingHorizontal: 15,
                    borderWidth: event.selectedDate === currentDateForTask ? 2.5 : 1,
                    borderColor: event.selectedDate === currentDateForTask ? '#DFBD08' : 'black'
                  }} 
                > 
                  <Text style={{ fontSize: 18, fontWeight: 800 }}>{event.type}</Text> 
                  <Text>{event.startTime}</Text> 
                  <TouchableOpacity 
                  activeOpacity={0.5} 
                  style={{ position: 'absolute', right: 10, top: 5 }} 
                  onPress={() => { 
                    console.log('Schedule ID:', event.id); 
                    navigation.navigate('changeSched'); 
                  }} 
                > 
                </TouchableOpacity> 
                </View> 
              </View> 
            </TouchableOpacity> 
          ))} 
        </View> 
        <View style={{ width: 330, marginTop: 20, alignItems: 'center' }}> 
          <View 
            style={{ 
              width: '95%', 
              height: 40, 
              backgroundColor: 'rgb(230, 230, 230)', 
              overflow: 'hidden', 
              borderRadius: 10, 
              borderWidth: 0.5, 
            }} 
          > 
            <TouchableOpacity activeOpacity={0.5} onPress={() => { setViewSched(false); }}> 
              <View 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  backgroundColor: 'rgb(247, 245, 243)', 
                }} 
              > 
                <Text>Show less</Text> 
              </View> 
            </TouchableOpacity> 
          </View> 
        </View> 
      </> 
    ); 
  } 
  function getEventBackgroundColor(event) { 
    if (event.type === 'Collection') { 
      return 'rgba(255, 203, 60, 0.5)'; 
    } else if (event.type === 'Event') { 
      return 'rgba(72, 229, 239, 0.5)'; 
    } else if (event.type === 'Assignment') { 
      return 'rgba(135, 255, 116, 0.5)'; 
    } 
  } 

  const onMonthChange = (month) => {
    setSelectedMonth(month.month - 1); 
  };

  function HeaderContent() {
    return (
        <>
            <View style={{flexDirection: 'row', gap: 7, top: 10}}>
                <View style={{alignItems: 'center'}}>
                    <Text style={{fontSize: 14, fontWeight: 500, color:'rgb(55,55,55)', marginBottom: 5}}>REPORTS TODAY</Text>
                    <View style={styles.headerCntr}>
                        <Text style={{fontSize: 40, fontWeight: 700, color:'rgb(55,55,55)'}}>{reportsToday}</Text>
                        <Text style={{fontSize: 14, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                    </View>
                </View>
                <View style={{alignItems: 'center'}}>
                    <Text style={{fontSize: 14, fontWeight: 500, color:'rgb(55,55,55)', marginBottom: 5}}>TOTAL REPORT</Text>
                    <View style={styles.headerCntr}>
                        <Text style={{fontSize: 40, fontWeight: 700, color:'rgb(55,55,55)'}}>{totalReports}</Text>
                        <Text style={{fontSize: 14, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                    </View>
                </View>
            </View>
      </>
    );
  }
  return ( 
    <> 
      <View style={{ position: 'absolute', right: 20, bottom: 70, zIndex: 99, height: 60, width: 60, borderRadius: 100, backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgb(81,175,91)', overflow: 'hidden' }}> 
        <TouchableOpacity activeOpacity={0.5} onPress={() => { navigation.navigate('addSched'); }}> 
          <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}> 
            <Ionicons name="add-circle" style={{ fontSize: 60, color: 'rgb(81,175,91)', top: -3, right: -0.9 }} /> 
          </View> 
        </TouchableOpacity> 
      </View> 
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={ 
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> 
      }> 
        <SafeAreaView style={styles.container}> 
          <TouchableOpacity activeOpacity={0.5} style={{ position: 'absolute', left: 20, top: 30, zIndex: 99 }}> 
            <Ionicons name="menu" style={{ fontSize: 40, color: '#ffffff' }} onPress={() => { setOpenSideBar(SideNavigation(navigation)) }} /> 
          </TouchableOpacity> 
          <TouchableOpacity activeOpacity={0.5} style={{ position: 'absolute', right: 20, top: 31, zIndex: 99 }} onPress={() => { navigation.navigate('notification') }}> 
            <Ionicons name="notifications" style={{ fontSize: 35, color: '#ffffff' }} /> 
          </TouchableOpacity> 
          <View style={styles.header1}> 
            <View style={styles.header2}> 
              <Image 
                source={require('../../assets/NatureVector.jpg')} 
                style={{ 
                  resizeMode: 'stretch', 
                  width: '100%', 
                  height: '150%', 
                  opacity: 0.5, 
                }} 
              /> 
            </View> 
          </View> 
          <View style={styles.header3}> 
            {HeaderContent()} 
          </View> 
          <SafeAreaView style={styles.body}> 
            <View style={styles.body}> 
              <View style={{ alignItems: 'center' }}> 
                <Text style={{ fontSize: 24, fontWeight: 700, color: 'black', marginBottom: 10, marginTop: -90 }}>SCHEDULE</Text> 
              </View> 
              <View> 
                <Calendar
                style={{ width: 320, backgroundColor: 'white', marginTop: -50, borderRadius: 10, paddingBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, }}
                markedDates={getMarkedDates(schedule)}
                markingType={'multi-dot'}
                onMonthChange={onMonthChange} // Call onMonthChange when the next button is clicked
                />
              </View> 
              <View style={{ width: 315, marginTop: 15, gap: 5 }}> 
                <View style={{ flexDirection: 'row', gap: 10 }}> 
                  <View style={{ width: 20, height: 20, backgroundColor: 'rgb(242, 190, 45)' }} /> 
                  <Text>Schedule for Collection</Text> 
                </View> 
                <View style={{ flexDirection: 'row', gap: 10 }}> 
                  <View style={{ width: 20, height: 20, backgroundColor: 'rgb(72, 229, 239)' }} /> 
                  <Text>Events</Text> 
                </View> 
                <View style={{ flexDirection: 'row', gap: 10 }}> 
                  <View style={{ width: 20, height: 20, backgroundColor: 'rgb(135, 255, 116)' }} /> 
                  <Text>Assignment</Text> 
                </View> 
              </View> 
              {viewSched ? <ViewSchedExtend scheduleData={schedule} /> : <ViewSchedButton scheduleData={schedule} />} 
            </View> 
          </SafeAreaView> 
        </SafeAreaView> 
      </ScrollView> 
      {openSideBar} 
    </> 
  ); 
} 

const styles = StyleSheet.create({ 
  container: { 
    flex: 1, 
    flexDirection: 'column', 
    backgroundColor: 'rgb(246, 242, 239)', 
    justifyContent: 'flex-start', 
    alignItems: 'center', 
    paddingBottom: 60, 
  }, 
  header1: { 
    width: '100%', 
    height: 252, 
    backgroundColor: 'rgb(220, 130, 47)', 
    zIndex: -50, 
  }, 
  header2: { 
    width: '100%', 
    height: '90%', 
    backgroundColor: 'rgb(134, 202, 81)', 
    overflow: 'hidden', 
    alignItems: 'center', 
  }, 
  header3: { 
    position: 'absolute', 
    width: 310, 
    height: 180, 
    top: 75, 
    backgroundColor: '#ffffff', 
    borderRadius: 15, 
    shadowColor: "#000", 
    shadowOffset: { 
      width: 0, 
      height: 10, 
    }, 
    shadowOpacity: 0.30, 
    shadowRadius: 10, 
    elevation: 6, 
    zIndex: 50, 
    alignItems: 'center', 
    paddingTop: 20, 
  }, 
  body: { 
    position: 'relative', 
    width: 350, 
    backgroundColor: 'rgb(228,237,229)', 
    paddingTop: 50, 
    paddingBottom: 10, 
    alignItems: 'center', 
  }, 
  headerCntr: { 
    width: 137, 
    height: 90, 
    backgroundColor: 'rgb(255,248,172)', 
    overflow: 'hidden', 
    shadowColor: "#000", 
    shadowOffset: { 
      width: 0, 
      height: 3, 
    }, 
    shadowOpacity: 0.27, 
    shadowRadius: 4.65, 
    elevation: 2, 
    justifyContent: 'center', 
    alignItems: 'center', 
  }, 
}); 