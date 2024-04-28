/**
* This exposes the native RFIDModule module as a JS module. This has a
* function 'createRfidEvent' which takes the following parameters:

* 1. String name: A string representing the name of the event
* 2. String location: A string representing the location of the event
*/
import {NativeModules} from 'react-native';
const {RFIDModule} = NativeModules;
interface RFIDModuleInterface {
    createRfidEvent(name: string, location: string, fun: Function): void;
    getRfidTagsData(fun: Function): void;
    scanCode(): void;
    intializeScanner(): void;
}

export default RFIDModule as RFIDModuleInterface;