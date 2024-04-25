import { firebase } from '../firebase_config';
import moment from 'moment/moment';
import PushNotif from './PushNotification';

export default function ChangeStatus(users, userUploads, id, changeType) {
    const changeToCollected = async(id) => {
        try {
            const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD HH:MM:SS');
            const docRef = firebase.firestore().collection("generalUsersReports").doc(id);
            await docRef.update(
                {status: 'collected'},
                {dateTimeCollected: fullDateTime}
            );

            let userFullName, location;
            userUploads.map((temp) => {
                if(temp.id.includes(id)) {
                    users.map((user) => {
                        if(user.id.includes(temp.userId)) {
                            userFullName = user.firstName + ' ' + user.lastName;
                        }
                    });
                    location = temp.location;
                }
            })

            const title = 'REPORTED GARBAGE COLLECTED - LGU';
            const body = 'Garbage reported by ' + userFullName + ' at location (' + location + ') has been collected';
            const fullDateTime2 = moment().utcOffset('+08:00').format('YYYY/MM/DD hh:mm:ss a');
            PushNotif(title, body, fullDateTime2);
        } catch(e) {
            console.error(e);
        }
    }

    const changeToUncollected = async(id) => {
        try {
            const docRef = firebase.firestore().collection("generalUsersReports").doc(id);
            await docRef.update(
                {status: 'uncollected'},
                {dateTimeCollected: ''}
            );
        } catch(e) {
            console.error(e);
        }
    }

    const choice = async(id, changeType) => {
        if(changeType === 'UNCOLLECTED') {
            changeToCollected(id);
        } else if(changeType === 'COLLECTED') {
            changeToUncollected(id);
        }
    }

    return (choice(id, changeType));
}