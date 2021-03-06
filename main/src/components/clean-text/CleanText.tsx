import * as React from "react";
import style from "./clean-text.styl?css-modules";

interface CleanTextProps {
  inputDOMRef: React.MutableRefObject<HTMLInputElement>;
  doWhenEmpty?: Function; // 清空是通过js的，故input的onChange无法检测到内容已变化，如果要在此时执行某个操作只能通过调用此prop
}

const { useState, useRef, useEffect, useImperativeHandle, forwardRef } = React;

const CleanText = forwardRef((props: CleanTextProps, ref) => {
  const { inputDOMRef, doWhenEmpty } = props;
  const [firstLetter, setFirstLetter] = useState(true);
  const btnRef: React.MutableRefObject<HTMLDivElement> = useRef(null);

  const cleanText = () => {
    inputDOMRef.current.value = "";
    btnRef.current.classList.remove(style.show);
    setFirstLetter(true);
  };

  useEffect(() => {
    const cleanBtnDOM = btnRef.current;
    inputDOMRef.current.value.length > 0 && cleanBtnDOM.classList.add(style.show);
    doWhenEmpty && cleanBtnDOM.addEventListener("click", () => { doWhenEmpty() });
    cleanBtnDOM.addEventListener("click", cleanText);
  }, []);

  useImperativeHandle(ref, () => ({
    clean: () => cleanText(),
    // useEffect无法监听到inputDOMRef.current.value的变化，故只能由父组件在值变化时调用checkIfShow
    checkIfShow: value => {
      if (value.length > 0 && firstLetter) {
        btnRef.current.classList.add(style.show);
        setFirstLetter(false);
      } else {
        btnRef.current.classList.remove(style.show);
      }
    }
  }), []);

  return (
    <div className={style.cleanBtn} ref={btnRef}>
      <svg className="icon" aria-hidden="true">
        <use href="#icon-close"></use>
      </svg>
    </div>
  )
})

export default CleanText;
