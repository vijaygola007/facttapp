const DATE_FORMAT = 'DD/MM/YYYY';
const TIME_FORMAT = 'hh:mm a';


const theme = {
    light: 'light',
    dark: 'dark'
};

const USER_DATA = 'userData';

const MONTH_NAME = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH_INDEX = ['01','02','03','04','05','06','07','08','09','10','11','12'];

const Is_Production_Environment = false;

const MEDIA_TYPE = {
  'jpg': 'Image',
  'jpeg': 'Image',
  'png': 'Image',
  'mp3': 'Audio',
  'mp4': 'Video',
  'image': 'Image',
  'audio': 'Audio',
  'video': 'Video'
}


const hexToRgbA = (hex: string, alpha: string = '0.4') => {
  var c;
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
    c= hex.substring(1).split('');
    if(c.length== 3){
        c= [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c= '0x'+c.join('');
    return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
  }
  return 'rgba(0,0,0,'+alpha+')';
}



const AlphaNumericPattern = (value:any) => {
    var pattern = /[0-9A-Za-z ]/;
    var val = '';
    if(value){
      for(var i=0; i<value.length; i++){
        if(value[i].match(pattern)){
          val = val+value[i];
        }
      }
    }
    return val;
}


const NumericPattern = (value:any) => {
    var pattern = /[0-9]/;
    var val = '';
    if(value){
      for(var i=0; i<value.length; i++){
        if(value[i].match(pattern)){
          val = val+value[i];
        }
      }
    }
    return val;
}

const InfiniteScroll = (event: any) => {
  let mHeight = event.nativeEvent.layoutMeasurement.height;
  let cSize = event.nativeEvent.contentSize.height;
  let Y = event.nativeEvent.contentOffset.y;
  if(Math.ceil(mHeight + Y) >= cSize){
      return true;
  }
  return false;
}

const capitalizeFirstLetter = (string: string, is_lower: boolean = true) => {
  if(is_lower){
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }else{
    return string;
  }
}

const GenerateRandomString = (length: number = 10) => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export {
    DATE_FORMAT,
    theme,
    USER_DATA,
    TIME_FORMAT,
    MONTH_NAME,
    Is_Production_Environment,
    hexToRgbA,
    AlphaNumericPattern,
    NumericPattern,
    InfiniteScroll,
    MONTH_INDEX,
    MEDIA_TYPE,
    capitalizeFirstLetter,
    GenerateRandomString
};
