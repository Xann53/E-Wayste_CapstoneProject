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
        userUploads.map((pin) => {
            if(pin.municipality === userMun || (page === 'Resident' && pin.userId === userId)) {
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