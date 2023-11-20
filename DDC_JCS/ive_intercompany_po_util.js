/**
* JCSP Library
*/

define(["N/record",
"N/log",
"N/transaction",
"N/search",
"N/format"],
Main);
function Main(
record,
log,
transaction,
search,
format){

    const TRADECREDITORS = 243;
    const ICCACCTSPAYABLE = 111;
    const TRADERECEIVABLE = 244;
    const ICCACCTSRECEIVABLE = 119;

    function getLineValue(line,params){
    try{
        var invID = params.invID;
        var invTotal = params.invTotal;
        var invSubs = params.invSubs;
        var invCust = params.invCust;
        var vbSubs = params.vbSubs;
        var vbEntity = params.vbEntity;
        var subs, account, debit, credit, name, elim, duesubs;
        if (line==1){
            subs = vbSubs
            debit = invTotal;
            credit = null;
            name = vbEntity
            elim = false;
            duesubs = null;
        }

        if (line==2){
            subs = vbSubs
            debit = null;
            credit = invTotal;
            name = getRepresent('vendor',invSubs);
            elim = true;
            duesubs =  invSubs;
        }

        if (line == 3){
            subs = getSubsidiary('invoice',invID);
            debit = null;
            credit = invTotal;
            name = invCust;
            elim = false;
            duesubs = null;
        }

        if (line == 4){
            subs = getSubsidiary('invoice',invID);
            debit = invTotal;
            credit = null;
            name = getRepresent('customer',vbSubs);
            elim = true;
            duesubs =   vbSubs;
        }

        account = getAccount(line);

        return new JELine(subs,account,debit,credit,name,elim,duesubs);

    }catch (ex){
        log.debug({
            title: 'getLineValue ex',
            details: ex
        });
    }

    }

    function JELine(subs,account,debit,credit,name,elim,duesubs){
        this.linesubsidiary = subs;
        this.account = account;
        this.debit = debit;
        this.credit = credit;
        this.entity = name;
        this.eliminate = elim;
        this.duetofromsubsidiary = duesubs;
    }
    
    function getAccount(line){
        var obj = {};
        obj[1] = TRADECREDITORS;
        obj[2] = ICCACCTSPAYABLE;
        obj[3] = TRADERECEIVABLE;
        obj[4] = ICCACCTSRECEIVABLE;
        log.debug({
            title: 'getAccount: '+line,
            details: obj[line]
        });
        return obj[line];
    }

    function getSubsidiary(type,id){
        var vals = search.lookupFields({
            type: type,
            id : id,
            columns : 'subsidiary'
        });
        return parseInt(vals.subsidiary[0].value);
    }

    function getRepresent(type,subid){
    try{
        var repSearch = search.create({
            type: type,
            filters:
            [
               ["representingsubsidiary","anyof",subid], 
               "AND", 
               ["isinactive","is","F"]
            ],
            columns:
            [
               search.createColumn({
                  name: "entityid"
               })
            ]
         });
         var searchResultCount = repSearch.runPaged().count;
         log.debug("repSearch result count",searchResultCount);
         var val = null;
         repSearch.run().each(function(result){
            val = result.id;
            return true;
         });
         return val;
    }catch (ex){
        log.debug({
            title: 'getRepresent ex',
            details: ex
        });
    }
    }

	return {
        getAccount : getAccount,
        getSubsidiary : getSubsidiary,
        JELine : JELine,
        getLineValue : getLineValue
        
	};
}