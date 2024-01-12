import axios from 'axios';

export default function PushNotif(title, body, dateTime) {
    const pushNotif = async(title, body, dateTime) => {
        axios.post('https://app.nativenotify.com/api/notification', {
            appId: 18226,
            appToken: "e3rUIe7b50DlmEkB0TkOEK",
            title: title,
            body: body,
            dateSent: dateTime,
        });
    }

    return (pushNotif(title, body, dateTime));
}