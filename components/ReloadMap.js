import moment from "moment/moment";

export default function Reload(userMun, mapType, setInfoID, userUploads, imageCol, setState, reloadType, page, userId) {
    const reload = async() => {
        let temp;

        if(reloadType === 'Auto') {
            if(mapType === 'collected')
                temp = 'uncollected';
            else if(mapType === 'uncollected')
                temp = 'collected';
        } else if(reloadType === 'Manual') {
            if(mapType === 'collected')
                temp = 'collected';
            else if(mapType === 'uncollected')
                temp = 'uncollected';
        }
        
        setState({ coordinates: [] });

        const currentMonth = parseInt(moment().utcOffset('+08:00').format('YYYY/MM/DD').split('/')[1]);
        const prevMonth = ((currentMonth - 1) < 1 ? 12 : currentMonth - 1);

        userUploads.map((pin) => {
            if(page === 'Resident' && pin.userId === userId && (parseInt(pin.dateTime.split('/')[1]) === currentMonth || parseInt(pin.dateTime.split('/')[1]) === prevMonth)) {
                let imageURL;
                imageCol.map((url) => {
                    if(url.includes(pin.associatedImage)) {
                        imageURL = url;
                    }
                })
                try {
                    if(temp === 'uncollected' && pin.status === 'uncollected') {
                        const lat = parseFloat(pin.latitude);
                        const long = parseFloat(pin.longitude);
                        setState((prevState) => ({
                            ...prevState,
                            coordinates: [...prevState.coordinates, { name: pin.id, latitude: lat, longitude: long, image: imageURL }],
                        }));
                    } else if(temp === 'collected' && pin.status === 'collected') {
                        const lat = parseFloat(pin.latitude);
                        const long = parseFloat(pin.longitude);
                        setState((prevState) => ({
                            ...prevState,
                            coordinates: [...prevState.coordinates, { name: pin.id, latitude: lat, longitude: long, image: imageURL }],
                        }));
                    }
                } catch (e) {
                    console.log(e);
                }
            } else if(page !== 'Resident' && pin.municipality === userMun && (parseInt(pin.dateTime.split('/')[1]) === currentMonth || parseInt(pin.dateTime.split('/')[1]) === prevMonth)) {
                let imageURL;
                imageCol.map((url) => {
                    if(url.includes(pin.associatedImage)) {
                        imageURL = url;
                    }
                })
                try {
                    if(temp === 'uncollected' && pin.status === 'uncollected') {
                        const lat = parseFloat(pin.latitude);
                        const long = parseFloat(pin.longitude);
                        setState((prevState) => ({
                            ...prevState,
                            coordinates: [...prevState.coordinates, { name: pin.id, latitude: lat, longitude: long, image: imageURL }],
                        }));
                    } else if(temp === 'collected' && pin.status === 'collected') {
                        const lat = parseFloat(pin.latitude);
                        const long = parseFloat(pin.longitude);
                        setState((prevState) => ({
                            ...prevState,
                            coordinates: [...prevState.coordinates, { name: pin.id, latitude: lat, longitude: long, image: imageURL }],
                        }));
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        })
        setInfoID();
    }

    return(reload());
}