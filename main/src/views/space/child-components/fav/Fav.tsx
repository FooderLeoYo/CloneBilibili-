import * as React from "react";
import { match } from "react-router-dom";
import { Helmet } from "react-helmet";

import { getFavDetail } from "@api/space";
import Context from "@context/index";
import { getPicSuffix } from "@customed-methods/image";

import HeaderWithBottom from "@components/header-with-bottom/HeaderWithBottom"
import VideoItemLandscape from "@components/video-item-landscape/VideoItemLandscape";
import ScrollToTop from "@components/scroll-to-top/ScrollToTop";

import style from "./fav.styl?css-modules";
import tips from "@assets/images/nocontent.png";

interface FavProps {
  match: match<{ mlid }>;
}

const { useContext, useState, useRef, useEffect } = React;

function Fav(props: FavProps) {
  const { match } = props;
  const context = useContext(Context);

  const [infoData, setInfoData] = useState(null);
  const [listData, setListData] = useState(null);
  const headerRef: React.MutableRefObject<HTMLDivElement> = useRef(null);
  const overlayRef: React.MutableRefObject<HTMLDivElement> = useRef(null);
  const staRef: React.MutableRefObject<HTMLDivElement> = useRef(null);
  const listRef: React.MutableRefObject<HTMLDivElement> = useRef(null);

  function getPicUrl(url, format) {
    const { picURL } = context;
    let suffix = ".webp";
    suffix = getPicSuffix();
    return `${picURL}?pic=${url}${format + suffix}`;
  }

  useEffect(() => {
    getFavDetail(match.params.mlid, 15).then(result => {
      const { code, data } = result;
      if (code === "1") {
        const { info, medias } = data.data;
        setInfoData(info);
        setListData(medias);

        // 在list不够长时，保证上拉时statistic也能贴着header
        const heightWithoutTop = screen.height - headerRef.current.offsetHeight - staRef.current.offsetHeight;
        const listDOM = listRef.current;
        if (listDOM.offsetHeight < heightWithoutTop) { listDOM.style.height = `${heightWithoutTop}px` }
      }
    });

    const headerHeight = headerRef.current.offsetHeight;
    const infoHeight = overlayRef.current.offsetHeight;
    const staDOM = staRef.current;
    staDOM.addEventListener("touchmove", () => {
      const toHeader = staDOM.getBoundingClientRect()["top"] - headerHeight;
      const ratio = 1 - toHeader / infoHeight
      if (ratio < 1) { overlayRef.current.style.opacity = `${ratio}` }
    });
    listRef.current.addEventListener("touchmove", () => {
      const toHeader = staDOM.getBoundingClientRect()["top"] - headerHeight;
      const ratio = 1 - toHeader / infoHeight
      if (ratio < 1) { overlayRef.current.style.opacity = `${ratio}` }
    });
  }, []);

  return (
    <>
      <Helmet><title>{infoData ? infoData.title : ""}</title></Helmet>
      <div className={style.header} ref={headerRef}><HeaderWithBottom mode={0} /></div>
      <div className={style.info}>
        <div className={style.imageContainer}>
          {infoData ? <img className={style.cover} src={getPicUrl(infoData?.cover, "@320w_200h")} /> :
            <span className={style.placeholder}>
              <svg className="icon" aria-hidden="true">
                <use href="#icon-placeholder"></use>
              </svg>
            </span>
          }
        </div>
        {infoData &&
          <div className={style.description}>
            <div className={style.title}>{infoData?.title}</div>
            <div className={style.intro}>{infoData?.intro}</div>
            <div className={style.creator}>{`创建者：${infoData?.upper.name}`}
            </div>
          </div>
        }
        <div className={style.overlay} ref={overlayRef} />
      </div>
      <div className={style.statistic} ref={staRef}>
        <div className={style.mediaCount}>{infoData?.media_count}个内容</div>
        {infoData?.attr != 0 && // 默认收藏夹无此项
          <div className={style.likeStatistic}>
            <div className={style.item}>
              <span className={style.icon}>
                <svg className="icon" aria-hidden="true">
                  <use href="#icon-playCount"></use>
                </svg>
              </span>
              <span className={style.count}>{infoData?.cnt_info.play}</span>
            </div>
            <div className={style.item}>
              <span className={style.icon}>
                <svg className="icon" aria-hidden="true">
                  <use href="#icon-thumbUp"></use>
                </svg>
              </span>
              <span className={style.count}>{infoData?.cnt_info.thumb_up}</span>
            </div>
            <div className={style.item}>
              <span className={style.icon}>
                <svg className="icon" aria-hidden="true">
                  <use href="#icon-favorites"></use>
                </svg>
              </span>
              <span className={style.count}>{infoData?.cnt_info.collect}</span>
            </div>
          </div>
        }
      </div>
      <div className={style.list} ref={listRef}>
        {listData && listData.map((video, i) => {
          const { cnt_info, cover, duration, id, title, upper } = video;
          const { play, danmaku } = cnt_info;
          const tempData = {
            aId: id, title: title, pic: "", desc: "", playCount: play,
            barrageCount: danmaku, publicDate: 0, duration: duration, cId: 0,
            url: "", owner: upper, twoLevel: null, oneLevel: null
          };
          const tempParams = { imgHeight: "10.575rem", imgSrc: cover, imgFormat: "@320w_200h" }

          return (
            <div className={style.videoWrapper} key={i}><VideoItemLandscape videoData={tempData} imgParams={tempParams} /></div>
          )
        })}
      </div>
      <ScrollToTop />
    </>
  )
}

export default Fav;