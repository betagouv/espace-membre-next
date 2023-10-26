import React from "react"
import Datepicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


export default ({ name, onChange, title, required, dateFormat, selected, min, max } : {
    name, onChange, title, required, dateFormat, selected?: Date, min, max?
}) => {

    return <Datepicker
            type="date"
            name={name}
            min={min}
            max={max}
            title={title}
            required={required}
            dateFormat={dateFormat}
            selected={selected}
            onChange={onChange} />
  
}
