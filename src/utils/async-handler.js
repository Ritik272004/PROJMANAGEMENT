const asyncHandler = (requestHandler) => {
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err) => next(err));
    };
}; /* higher order function(because it take function as input and return a function 
that execute input function)*/

export {asyncHandler}