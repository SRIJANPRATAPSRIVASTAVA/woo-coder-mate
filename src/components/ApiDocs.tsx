import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export const ApiDocs = () => {
    return (
        <div className="api-docs-container">
            <SwaggerUI 
                url="https://gist.githubusercontent.com/SRIJANPRATAPSRIVASTAVA/027a53172c8d198d84cdc5bed3b2352f/raw/fc624dcc6414fdd5b39b98ead850cd67e16da3c3/docs.yaml"></SwaggerUI>
        </div>
    );
};

// https://gist.githubusercontent.com/SRIJANPRATAPSRIVASTAVA/027a53172c8d198d84cdc5bed3b2352f/raw/fc624dcc6414fdd5b39b98ead850cd67e16da3c3/docs.yaml