
const getTimenDate=(n,m)=>{ 
    document.getElementById('sentence').innerHTML=`booked from ${n} to ${m}`
 }

let clickCount = 0; 
const hrs = document.getElementById('hrs')
const sd =document.getElementById('start_date');
const ed =document.getElementById('end_date'); 
const cn = document.getElementById('cust_name');
const num = document.getElementById('cust_num'); 

 
const sendDate=(l,c)=>{  
    if(c==true){ sd.value=isoToMyDates(myDatesToIso(l)); 
        let dan = l.split('-'); 
        dan[0]=Number(dan[0])+1; 
        dan = dan.join('-'); 
        dan= myDatesToIso(dan); 
        ed.value = isoToMyDates(dan)
    } 
    else{
        clickCount++; if(clickCount==1){sd.focus(); sd.value=isoToMyDates(myDatesToIso(l));  } if(clickCount==2){ed.focus(); ed.value=isoToMyDates(myDatesToIso(l)); clickCount=0;}}}
const validation=()=>{ 
    const h =myDatesToIso(sd.value)
    const j =myDatesToIso(ed.value)
    if (cn.value.length <= 2){ 
        document.getElementById('sentence').innerHTML="Your name seems too short!";
        return false ;
    }
    if(num.value.length !== 10 && typeof(num.value)!=="number" ){ 
        document.getElementById('sentence').innerHTML= 'enter a valid phone number';
        return false ;
    }  
    
    if (j < h){ 
        document.getElementById('sentence').innerHTML='Sorry! we can\'t book you a time machine.Please enter Dates in order.';
        return false;
    }        
}    
const myDatesToIso=( virtualDate )=>{ 
    const n = virtualDate.split('-') ; n[1]= Number(n[1])-1; 
    let nDate = new Date(n[2],n[1],n[0]); 
    const offSet= nDate.getTimezoneOffset(); 
    nDate = new Date(nDate.getTime()-(offSet*60*1000)); 
    return nDate.toISOString();
} 
const isoToMyDates=(isoString)=>{ 
    const p = isoString.split('T'); 
    const mDate = p[0].split('-').reverse().join('-'); 
    return mDate;
}