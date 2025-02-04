sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/UIComponent",
     "sap/ui/export/Spreadsheet"
], (Controller, JSONModel, Filter, FilterOperator, MessageToast, MessageBox, UIComponent,Spreadsheet) => {
    "use strict";
    var oGModel, that;

    return Controller.extend("vcpapp.vcpplanningrelevantpid.controller.Home", {
        onInit() {
            that = this;
            that.skip = 0;
            that.allData = [];
            if (!that._locFrag) {
                that._locFrag = sap.ui.xmlfragment("vcpapp.vcpplanningrelevantpid.fragments.loc", that);
                that.getView().addDependent(that._locFrag);
            }

            if (!that._prodFrag) {
                that._prodFrag = sap.ui.xmlfragment("vcpapp.vcpplanningrelevantpid.fragments.prod", that);
                that.getView().addDependent(that._prodFrag);
            }
        },
        





        onAfterRendering:function(){
            that.byId("idcluCount").setText("Clustering Count : 0");
            sap.ui.core.BusyIndicator.show();
            oGModel = that.getOwnerComponent().getModel("oGModel");
            that.getOwnerComponent().getModel("BModel").read("/getLocation", {
                success: function (oData) {
                    that.aLocData = oData.results;
                    that.LocModel = new JSONModel();
                    that.LocModel.setData({
                        LocModel: that.aLocData 
                    })
                    sap.ui.getCore().byId("loc").setModel(that.LocModel);
                    sap.ui.core.BusyIndicator.hide();
                    that.getProduct()
                 
                },
                error: function (oData, error) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageToast.show("error");
                },
            });
        },
        getProduct:function(){
            var topCount = parseInt(30000)
            sap.ui.core.BusyIndicator.show();
            that.getOwnerComponent().getModel("BModel").read("/genPartialProd", {
                urlParameters: {
                    "$skip": that.skip,
                    "$top": topCount
                },
                success: function (oData) {
                    sap.ui.core.BusyIndicator.hide();
                    if (topCount == oData.results.length) {
                        that.skip += topCount;
                        that.allData = that.allData.concat(oData.results);
                        that.getProduct();
                    } else {
                        that.skip = 0;
                        that.allData = that.allData.concat(oData.results);
                        oData.results = that.allData;
                        that.ProdData = that.allData;
                        that.ProdModel = new JSONModel();
                        that.prodData = oData.results;
                        that.ProdModel.setData({
                            ProdModel: oData.results
                        });
                    }
                },
                error: function (oData, error) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageToast.show("error");
                },
            });
        },
        onClose:function(oEvent){
                that._prodFrag.close();
            
           
        },
        onValueHelp:function(oEvent){
            var oEv = oEvent.getSource().sId;
            if(oEv.includes("idLocation")){
                sap.ui.getCore().byId("loc").getBinding("items").filter([])
                that._locFrag.open()

            }else{
                if(that.byId("idLocation").getValue().length > 0){ 
                    sap.ui.getCore().byId("prod").getBinding("items").filter([])
                    that._prodFrag.open()
                }else{
                    MessageToast.show("Please Select a Location")
                }
                
            }
            
        },
        onLocationSelect:function(oEvent){
            var oEv = oEvent.getParameter("selectedItem");
            if (!oEv) {
                return;
            }
            that.aProd = that.ProdData.filter((e) => e.LOCATION_ID == oEv.getTitle());
            that.ProdModel = new JSONModel();
            that.ProdModel.setData({
                ProdModel: that.aProd
            });
            sap.ui.getCore().byId("prod").setModel(that.ProdModel)
            that.byId("idLocation").setValue(oEv.getTitle());
            that.byId("idProduct").setValue("")
            // that._locFrag.close()
        },
        onProdSelect:function(oEvent){
            var oEv = oEvent.getParameter("selectedItem");
            if(!oEv){
                return
            }
            that.byId("idProduct").setValue(oEv.getTitle());
            // that.onGetData()
          
        },
        onReset:function(){
            that.byId("idLocation").setValue("");
            that.byId("idProduct").setValue("");
            that.byId("idPrpIdType").setSelectedKey("3");
            // var existingDiv = document.querySelector(`[id*=mainDiv]`);
            // var newDiv = document.createElement("div");
            // newDiv.id = `pivotGrid`;
            // newDiv.textContent = "";
            var excel = document.querySelector("[id*=mainDiv]");
            excel.innerHTML = " ";
            that.byId("idcluCount").setText("Clustering Count : 0");
        },
        handleSearch:function(oEvent){
            var sQuery =
            oEvent.getParameter("value") || oEvent.getParameter("newValue"),
            sId = oEvent.getParameter("id"),
            oFilters = [];
        sQuery = sQuery ? sQuery.trim() : "";
        if (sId.includes("loc")) {
            if (sQuery !== "") {
                oFilters.push(
                    new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("LOCATION_ID", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("LOCATION_DESC", sap.ui.model.FilterOperator.Contains, sQuery)
                        ],
                        and: false
                    })
                );
            }


            sap.ui.getCore().byId("loc").getBinding("items").filter(oFilters);

        }
        else if (sId.includes("prod")) {
            if (sQuery !== "") {
                oFilters.push(
                    new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("PRODUCT_ID", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("PROD_DESC", sap.ui.model.FilterOperator.Contains, sQuery)
                        ],
                        and: false
                    })
                );
            }
            sap.ui.getCore().byId("prod").getBinding("items").filter(oFilters);
        }

            
        },
        onSelectionofPrpType:function(oEvent){
            that.selLoc = that.byId("idLocation").getValue();
            that.oSelProd = that.byId("idProduct").getValue();
            if(that.selLoc.length > 0 && that.oSelProd.length > 0){
                // var oEv = oEvent.getSource()
                // var oSelId = that.byId("idPrpIdType").getSelectedKey();
                that.onGetData()
                // var data  = that.oPrimKeys.filter((e) => e.PRP_PID_TYPE == parseInt(oSelId))
                // if (data.length > 0) {
                //     that.pivotTable(data);
                // } else {
                    // var excel = document.querySelector("[id*=mainDiv]");
                    // excel.innerHTML = " ";
                    // MessageToast.show("No Data for Selected Primary ID Type");
    
                // }
            }else{
                MessageToast.show("Please Select Mandatory Fields")
                return;   
            }
        },
        onGetData:function(){
            that.selLoc = that.byId("idLocation").getValue();
            that.oSelProd = that.byId("idProduct").getValue();
            if(that.selLoc.length > 0 && that.oSelProd.length > 0 ){
            sap.ui.core.BusyIndicator.show();
            that.getOwnerComponent().getModel("BModel").callFunction("/getClusterPRPid", {
                method: "GET",
                urlParameters: {
                    LOCATION_ID: that.selLoc,
                    PRODUCT_ID: that.oSelProd,
                },
                success: function (oData) {
                    sap.ui.core.BusyIndicator.hide();
                    that.oPrimKeys = JSON.parse(oData.getClusterPRPid);
                    that.getOwnerComponent().getModel("oGModel").setProperty("/DownLoadData", that.oPrimKeys);

                    oGModel = that.getOwnerComponent().getModel("oGModel");
                    var sKey = that.byId("idPrpIdType").getSelectedKey();
                    if(sKey){
                        var data  = that.oPrimKeys.filter((e) => e.PRP_PID_TYPE == parseInt(sKey))
                    }
                    else{
                        var data = that.oPrimKeys;
                    }
                    if (data.length > 0) {
                        that.pivotTable(data);
                    } else {
                        MessageToast.show("No Data for Selected Fields");
                        var excel = document.querySelector("[id*=mainDiv]");
                        excel.innerHTML = " ";
                        that.byId("idcluCount").setText("Clustering Count : 0");
                    }
                    // var count = data.map(item => item.CLUSTER_ID);

                    var count = that.removeDuplicate(data, "CLUSTER_ID");

                    that.byId("idcluCount").setText("Clustering Count : " + " " + count.length);

                },
                error: function (oData, error) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageToast.show("error");
                },
            })
        }else{
            MessageToast.show("Please Select Mandatory Fields")
            return;
        }




        },
        removeDuplicate: function (array, key) {
            var check = new Set();
            return array.filter(obj => !check.has(obj[key]) && check.add(obj[key]));
        },
        // Pivot table functions
        jsonToPivotData: function (data) {
            const headers = [];
            const keys = Object.keys(data[0]);
            keys.forEach(key => {
                let label;
                switch (key) {
                    case "CLUSTER_ID":
                        label = "Cluster_ID";
                        break;
                    case "PROFILE":
                        label = "Profile";
                        break;
                    
                    case "PID":
                        label = "Primary_ID";
                        break;
                    case "PRPID":
                        label = "PRP_ID";
                        break;

                    case "PRP_PID_TYPE":
                        label = "Prp Pid Type";
                        break;
    
                    case "CHARVAL_DESC":
                        label = "Char Desc";
                        break;
                    case "CHAR_NAME":
                        label = "Char Name";
                        break;
                    case "CHAR_VALUE":
                        label = "Char Val";
                        break;
                    case "REF_PRODID":
                        label = "Ref Prod ID";
                        break;
                    case "WEIGHTAGE":
                        label = "Weightage";
                        break;
                    case "GROUP_NAME":
                        label = "Group Name";
                        break;
                    default:
                        label = key;
                        break;
                }
                headers.push(label);
            });
            that.headers = headers;
            const data1 = data.map(item => Object.values(item));
            return [headers, ...data1];
        },
        addScrollEvent: function () {
            var oPivotDiv = that.byId("mainDiv").getDomRef();

            // Track previous scroll position
            var lastScrollTop = 0;
            var isEventTriggered = false;

            if (oPivotDiv) {
                oPivotDiv.addEventListener("scroll", function (e) {
                    var currentScrollTop = oPivotDiv.scrollTop;
                    var scrollHeight = oPivotDiv.scrollHeight;
                    var clientHeight = oPivotDiv.clientHeight;

                    // Check if the user has scrolled vertically (ignores horizontal scroll)
                    if (currentScrollTop > lastScrollTop) {
                        // User is scrolling vertically
                        // Check if scrolled to the bottom and the event hasn't already triggered
                        if (!isEventTriggered && that.hasMoreData && currentScrollTop + clientHeight >= scrollHeight - 1) {
                            // Trigger the event only once
                            isEventTriggered = true;

                            // Load more data
                            // that.skip += that.topCount;
                            // that.loadData(that.skip, that.topCount);

                            // Reset the flag after data loading is done (example: simulate data load completion)
                            setTimeout(function () {
                                isEventTriggered = false;
                            }, 1000); // Adjust the timeout according to data loading time
                        }
                    }

                    // Update last scroll position
                    lastScrollTop = currentScrollTop;
                });
            }
        },
        pivotTable: function (data) {
            that.pivotData = data
            that.PData = data.map(item => item.PRIMARY_ID);
            that.PRIMARY_ID = [];
            that.aUnSelected = [];

            // data = data.sort((a, b) => a.QUANTITY - b.QUANTITY);

            that.selLoc = data[0].LOCATION_ID;
            that.selProd = data[0].PRODUCT_ID;

            var existingDiv = document.querySelector(`[id*=mainDiv]`);
            var newDiv = document.createElement("div");
            newDiv.id = `pivotGrid`;
            newDiv.textContent = "";
            var existingDiv = document.querySelector(`[id*='mainDiv']`);

            existingDiv.appendChild(newDiv);
            var pivotDiv = document.querySelector(`[id*='pivotGrid']`);

            if (window.jQuery && window.jQuery.fn.pivot) {
                var pivotDiv = that.byId("mainDiv").getDomRef();
                var pivotData = that.jsonToPivotData(data);
                // that.pivotData = pivotData;

                if (!rows) {
                    var rows = ["PRP_ID",  "Profile","Cluster_ID", "Primary_ID"]; //common rows
                }
                that.curRows = rows;
                if (!cols) {
                    var cols = [ "Group Name", "Char Name"];
                }
                if (!val) {
                    var val = ["Char Val"];
                }
                that.curVal = val;
                // var sum = $.pivotUtilities.aggregatorTemplates.sum;                
                // var numberFormat = $.pivotUtilities.numberFormat;
                // var intFormat = numberFormat({digitsAfterDecimal: 0});
                // $("#output").pivotUI(
                //     $.pivotUtilities.tipsData, {
                //       rows: ["sex", "smoker", "Age"],
                //       cols: ["day", "time"],
                //       vals: ["tip", "total_bill"],
                //       aggregatorName: "Sum over Sum",
                //       rendererName: "Table"
                //     });
                $(pivotDiv).pivot(pivotData, {
                    rows: rows,
                    cols: cols,
                    // aggregator: sum(intFormat)(["val"]),
                    // aggregator: $.pivotUtilities.aggregators["Sum"](val),
                    aggregator: $.pivotUtilities.aggregators["List Unique Values"](val),
                    renderer: $.pivotUtilities.renderers["Table"],
                    // rendererOptions: {
                    //     // table: {
                    //     clickCallback: function (e, value, filters, pivotData) {
                    //         var names = [];
                    //         that.cellD = filters;
                    //         that.sPresVal = that.cellD["Primary ID"];




                    //     }
                    //     // },

                    // },

                    sorters: {
                        // "Primary ID": function (a, b) {
                        //     if (!that.sortCols || !that.sortCols.length) return 0;

                        //     const getCharValue = (id, col) =>
                        //         that.pivotData.find(o => o.PID === id && o.CHAR_NAME === col)?.CHAR_VALUE;

                        //     const compareValues = (valA, valB) => {
                        //         if (typeof valA === "number" && typeof valB === "number") {
                        //             return valA - valB;
                        //         } else {
                        //             return String(valA).localeCompare(String(valB));
                        //         }
                        //     };

                        //     for (let i = 0; i < that.sortCols.length; i++) {
                        //         const col = that.sortCols[i];
                        //         const valA = getCharValue(a, col);
                        //         const valB = getCharValue(b, col);

                        //         if (valA !== undefined && valB !== undefined) {
                        //             const result = compareValues(valA, valB);
                        //             if (result !== 0) return result;
                        //         } else {
                        //             return 0; // Stop comparison if any value is undefined
                        //         }
                        //     }

                        //     return 0; // All columns are equal
                        // },
                        "PRP_ID ID": function (a, b) {
                            return 0;
                        },
                        "Profile": function (a, b) {
                            return 0;
                        },
                        "Cluster_ID": function (a, b) {
                            const compareValues = (valA, valB) => {
                                if (typeof valA === "number" && typeof valB === "number") {
                                    return valB - valA;
                                } else {
                                    return String(valB).localeCompare(String(valA));
                                }
                            };
                            const result = compareValues(parseInt(a), parseInt(b));
                            return result;
                        },
                        "Group Name": function (a, b) {

                            const getCharValue = (id) =>
                                that.pivotData.find(o => o.GROUP_NAME === id)?.WEIGHTAGE;
    
                                const compareValues = (valA, valB) => {
                                    if (typeof valA === "number" && typeof valB === "number") {
                                        return valB - valA;
                                    } else {
                                        return String(valB).localeCompare(String(valA));
                                    }
                                };
                                    const valA = getCharValue(a);
                                    const valB = getCharValue(b);
                                const result = compareValues(parseInt(valA), parseInt(valB));
                                return result
                            }
                     
                    }
                });
                $(pivotDiv).ready(function () {
                    $(pivotDiv).find('tbody th').each(function (i) {
                        that.index = i;
                        $(this).on('click', function (value, filters) {
                            let tr2 = $(pivotDiv).find('thead tr')[1];
                            let cellIn = $(this).index();

                            var temp = that.PData.filter(el => el == $(this).text());

                            if (temp.length > 0) {
                                if ($(this)[0].className.includes("colorGreen") === true) {
                                    $(this).removeClass("colorGreen");
                                    $(this).addClass("colorRed");
                                    var obj = { pid: $(this).text() };
                                    that.aUnSelected.push(obj);
                                    

                                } else if ($(this)[0].className.includes("colorYellow") === true) {
                                    $(this).removeClass("colorYellow");
                                    var index = that.PRIMARY_ID.findIndex(el => el.pid === $(this).text());
                                    that.PRIMARY_ID.splice(index, 1);
                                } else if ($(this)[0].className.includes("colorRed") === true) {
                                    $(this).removeClass("colorRed");
                                    $(this).addClass("colorGreen");
                                    var index = that.aUnSelected.findIndex(el=> el.pid === $(this).text());
                                    that.aUnSelected.splice(index, 1);

                                } else {
                                    $(this).addClass('colorYellow');
                                    var obj = { pid: $(this).text() };
                                    that.PRIMARY_ID.push(obj);
                                }


                            }

                            // if($(this).rowspan <10 && cellIn >0){
                            //     cellIn +=2
                            // }
                            // let label = $(tr2).find('th')[cellIn].textContent

                            // // var clickedText = $(this).text(); // Get the text of the clicked <th>
                            // // var rowIndex = $(this).closest('tr').index()
                            // // that.sPivotText = clickedText
                            // // var rowHeader = $(pivotDiv).find('tbody .pvtRowLabel').eq(rowIndex).text().trim();
                            // // console.log(rowHeader)
                            // // alert("TH Clicked:\n" + clickedText);
                        })
                    })
                    // $(pivotDiv).find('thead th').each(function () {
                    //     $(this).on('click', function () {
                    //         var colHeader = $(this).text().trim();
                    //         alert("Column Header Clicked: " + colHeader);
                    //     });
                    // });
                    $(pivotDiv).find("tr:last").hide();
                    $(pivotDiv).find('thead:first tr:first th:last-child').hide();
                    $(pivotDiv).find('tbody tr').each(function () {
                        $(this).find('td:last-child').hide();
                    })
                }, 0);

          





                $(pivotDiv).ready(function () {
                    $(pivotDiv).find("tr:last").hide();
                    $(pivotDiv).find('th[rowspan]').each(function () {
                        if (parseInt($(this).attr('rowspan')) > 7) {
                            $(this).css('vertical-align', 'top');
                        }
                    });
                    // let sSelPri = that.PrpidsPrimaryIds;

                    // let aLoop = $(pivotDiv).find('tbody th')
                    // for (var i = 2; i < aLoop.length; i++) {
                    //     for (var j = 0; j < sSelPri.length; j++) {
                    //         if (aLoop[i].innerHTML == sSelPri[j].PRIMARY_ID) {
                    //             $(aLoop[i]).addClass('colorGreen');
                    //         }
                    //     }
                    // }


                    // $(pivotDiv).find('tbody th').each(function (){
                    //     $(pivotDiv).find('tbody th')[2].innerHTML
                    // })
                    //For THead
                    // let firstTrLength = $(pivotDiv).find('thead').find('tr:first').find('th').length;

                    //COMMENTED BELOW CODE

                    // let widthsHead = [0];
                    // for (let i = 0; i < 2; i++) {
                    //     let w = $(pivotDiv).find('thead').find('tr:first').find(`th:eq(${i})`).outerWidth();
                    //     widthsHead.push(widthsHead[i] + w);
                    // }
                    // const secondTr = $(pivotDiv).find('thead').find('tr')[1]
                    // let secondTrLength = $(secondTr).find('th').length;
                    // let widthsHead2 = [0];
                    // for (let i = 0; i < secondTrLength; i++) {
                    //     const secondTr = $(pivotDiv).find('thead').find('tr')[1]
                    //     let w = $(secondTr).find(`th:eq(${i})`).outerWidth();
                    //     widthsHead2.push(widthsHead2[i] + w);
                    // }

                    // $(pivotDiv).find('thead').find('tr').each(function (e) {
                    //     if (e == 0) {
                    //         $(this).find('th').each(function (e) {
                    //             if (e == 0 || e === 1) {
                    //                 $(this).addClass('frezzThead');
                    //                 $(this).css('left', `${widthsHead[e]}px`);
                    //                 // if()
                    //             }

                    //         });
                    //     }
                    //     if (e == 1) {
                    //         $(this).find('th').each(function (e) {
                    //             $(this).addClass('frezzThead');
                    //             $(this).css('left', `${widthsHead2[e]}px`);

                    //         });
                    //     }
                    // });





























                    var tr1 = $(pivotDiv).find('thead').find('tr')[0];
                    var th1 = $(tr1).find('th')[0];
                            $(th1).attr("rowspan", 1);
                    
                    var tr2 = $(pivotDiv).find('thead').find('tr')[1];  
                        $(tr2).prepend('<th colspan="4" rowspan="1"></th>');    



                    var widthsHeadnew =[0];
                    for (let i = 0; i < 2; i++) {
                        let w = $(pivotDiv).find('thead').find('tr:first').find(`th:eq(${i})`).outerWidth();
                        widthsHeadnew.push(widthsHeadnew[i] + w);
                    }

                    // let widthsHead21 = widthsHeadnew;
                    // const secondTr1 = $(pivotDiv).find('thead').find('tr')[1]
                    // let secondTrLength1 = $(secondTr1).find('th').length;
                    // let widthsHead21 = [widthsHeadnew[1]];
                    // // for (let i = 1; i < 2; i++) {
                    //     // const secondTr1 = $(pivotDiv).find('thead').find('tr')[1]
                    //     let w = $(secondTr1).find(`th:eq(${0})`).outerWidth();
                    //     widthsHead21[0] = widthsHead21[0] + w
                    //     // widthsHead21.push(widthsHead21[i] + w);
                    // // }


                    const thirTr1 = $(pivotDiv).find('thead').find('tr')[2]
                    let ThirTrLength1 = $(thirTr1).find('th').length;
                    let widthsHeadnew1 = [0];
                    for (let i = 0; i < 4; i++) {
                        const thirTr1 = $(pivotDiv).find('thead').find('tr')[2]
                        let w = $(thirTr1).find(`th:eq(${i})`).outerWidth();
                        widthsHeadnew1.push(widthsHeadnew1[i] + w);
                    }

                    $(pivotDiv).find('thead').find('tr').each(function (e) {
                        if (e == 0) {
                            $(this).find('th').each(function (e) {
                                if (e == 0 || e === 1) {
                                    $(this).addClass('frezzThead1');
                                    $(this).css('left', `${widthsHeadnew[e]}px`);
                                    // if()
                                }

                            });
                        }
                        if (e == 1) {
                            $(this).find('th').each(function (e) {
                                if (e == 0 || e === 1) {
                                    $(this).addClass('frezzThead2');
                                    $(this).css('left', `${widthsHeadnew[e]}px`);
                                    // if()
                                }

                            });
                        }

                        if (e == 2) {
                            $(this).find('th').each(function (e) {
                                $(this).addClass('frezzThead3');
                                $(this).css('left', `${widthsHeadnew1[e]}px`);

                            });
                        }

                        // if (e == 3) {
                        //     $(this).find('th').each(function (e) {
                        //         $(this).addClass('frezzThead');
                        //         $(this).css('left', `${widthsHead21[e]}px`);

                        //     });
                        // }
                    });














                    // for TBody
                    let firstTrLength = $(pivotDiv).find('tbody').find('tr:first').find('th').length;
                    let widths = [0];
                    for (let i = 0; i < firstTrLength; i++) {
                        let w = $(pivotDiv).find('tbody').find('tr:first').find(`th:eq(${i})`).outerWidth();
                        widths.push(widths[i] + w);
                    }
                    $(pivotDiv).find('tbody').find('tr').each(function () {
                        let currentTrLength = $(this).find('th').length;
                        let diff = firstTrLength - currentTrLength;
                        if (diff < 0) {
                            firstTrLength = currentTrLength;
                        }
                        $(this).find('th').each(function (e) {
                            let diff = firstTrLength - currentTrLength;
                            if (diff > 0)
                                e += diff;
                            $(this).addClass('frezz');
                            $(this).css('left', `${widths[e]}px`);

                        });
                    });

                    $(pivotDiv).find('td').each(function () {
                        // Get the current cell text
                        let cellText = $(this).text();

                        // Check if there is a decimal and remove everything after it
                        if (cellText.includes('.')) {
                            $(this).text(cellText.split('.')[0]); // Keep only the part before the decimal
                        } else if (!cellText) {
                            $(this).text(0);
                        }
                    });
                }, 0);
                // that.byId('pivotPage').setBusy(false);
            } else {
                console.error("Pivot.js or jQuery is not loaded yet.");
                that.byId('pivotPage').setBusy(false);
            }

        },
        onDownLoad: function () {
            that.selLoc = that.byId("idLocation").getValue();
            that.oSelProd = that.byId("idProduct").getValue();
            var excel = document.querySelector("[id*=mainDiv]");
            if(excel.innerHTML == "" || excel.innerHTML == " "){
                MessageToast.show("No Data is not displaying for download");
                return;
            }

            var aCols, oSettings, oSheet;
            var sFileName = "Planning Relevant PID"
            var aCols = [];
            var oStore = [];
            var aDownLoad = that.getOwnerComponent().getModel("oGModel").getProperty("/DownLoadData");


            var aDown = Object.values(aDownLoad)
            for (var j = 0; j < Object.keys(aDown[0]).length; j++) {
                aCols.push({
                    property: Object.keys(aDown[0])[j]
                });
            }
            var oSettings = {
                workbook: {
                    columns: aCols
                },
                dataSource: aDownLoad,
                fileName: sFileName,
                worker: true
            };
            var oSheet = new sap.ui.export.Spreadsheet(oSettings);
            oSheet.build().finally(function () {
                oSheet.destroy();
            });



        },

    });
});